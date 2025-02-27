import { Hono } from 'hono';

const router = new Hono();

// Satın alma listesi
router.get('/orders', async (c) => {
    const db = c.get('db');
    
    try {
        const { results } = await db.prepare(`
            SELECT 
                po.*,
                s.name as supplier_name,
                s.phone as supplier_phone,
                u.name as created_by_name,
                COUNT(poi.id) as item_count,
                COALESCE(SUM(poi.quantity * poi.unit_price), 0) as calculated_total
            FROM purchase_orders po
            LEFT JOIN suppliers s ON po.supplier_id = s.id
            LEFT JOIN users u ON po.created_by = u.id
            LEFT JOIN purchase_order_items poi ON po.id = poi.order_id 
                AND poi.deleted_at IS NULL
            WHERE po.deleted_at IS NULL
            GROUP BY po.id
            ORDER BY po.order_date DESC
        `).all();
        
        return c.json({
            success: true,
            orders: results
        });
    } catch (error) {
        console.error('Purchase orders error:', error);
        return c.json({
            success: false,
            error: 'Database error',
            details: error.message
        }, 500);
    }
});

// Satın alma detayı
router.get('/orders/:id', async (c) => {
    const db = c.get('db');
    const { id } = c.req.param();
    
    try {
        // Ana sipariş bilgileri
        const order = await db.prepare(`
            SELECT 
                po.*,
                s.name as supplier_name,
                s.phone as supplier_phone,
                s.email as supplier_email,
                u.name as created_by_name
            FROM purchase_orders po
            LEFT JOIN suppliers s ON po.supplier_id = s.id
            LEFT JOIN users u ON po.created_by = u.id
            WHERE po.id = ? AND po.deleted_at IS NULL
        `).bind(id).first();

        if (!order) {
            return c.json({
                success: false,
                error: 'Purchase order not found'
            }, 404);
        }

        // Sipariş kalemleri
        const { results: items } = await db.prepare(`
            SELECT 
                poi.*,
                rm.name as material_name,
                rm.description as material_description,
                u.code as unit_code
            FROM purchase_order_items poi
            LEFT JOIN raw_materials rm ON poi.material_id = rm.id
            LEFT JOIN units u ON rm.unit_id = u.id
            WHERE poi.order_id = ? 
            AND poi.deleted_at IS NULL
        `).bind(id).all();

        return c.json({
            success: true,
            order: {
                ...order,
                items: items || []
            }
        });

    } catch (error) {
        console.error('Purchase order detail error:', error);
        return c.json({
            success: false,
            error: 'Database error',
            details: error.message
        }, 500);
    }
});

// Yeni satın alma siparişi oluştur
router.post('/orders', async (c) => {
    const db = c.get('db');
    
    try {
        const body = await c.req.json();
        console.log('Purchase order request:', body); // Debug log

        // Validasyon
        if (!body.supplier_id || !body.items?.length) {
            return c.json({
                success: false,
                error: 'Tedarikçi ve en az bir ürün gereklidir'
            }, 400);
        }

        // 1. Ana siparişi oluştur
        const orderResult = await db.prepare(`
            INSERT INTO purchase_orders (
                supplier_id,
                order_date,
                notes,
                payment_status,
                total_amount,
                created_by
            ) VALUES (?, ?, ?, 'pending', ?, 1)
        `).bind(
            body.supplier_id,
            body.order_date || new Date().toISOString().split('T')[0],
            body.notes || null,
            body.total_amount || 0
        ).run();

        const orderId = orderResult.meta?.last_row_id;
        if (!orderId) throw new Error('Sipariş oluşturulamadı');

        // 2. Sipariş kalemlerini ekle
        for (const item of body.items) {
            await db.prepare(`
                INSERT INTO purchase_order_items (
                    order_id,
                    material_id,
                    quantity,
                    unit_price
                ) VALUES (?, ?, ?, ?)
            `).bind(
                orderId,
                item.material_id,
                item.quantity,
                item.unit_price
            ).run();
        }

        return c.json({
            success: true,
            order_id: orderId
        });

    } catch (error) {
        console.error('Create purchase order error:', error); // Debug log
        return c.json({
            success: false,
            error: 'Database error',
            details: error.message
        }, 500);
    }
});

// Satın alma durumunu güncelle
router.put('/orders/:id/status', async (c) => {
    const db = c.get('db');
    const { id } = c.req.param();
    const { status } = await c.req.json();

    try {
        const validStatuses = ['pending', 'partial', 'paid', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return c.json({
                success: false,
                error: 'Invalid status'
            }, 400);
        }

        await db.prepare(`
            UPDATE purchase_orders 
            SET 
                payment_status = ?,
                updated_at = datetime('now')
            WHERE id = ? AND deleted_at IS NULL
        `).bind(status, id).run();

        return c.json({ success: true });

    } catch (error) {
        console.error('Update purchase status error:', error);
        return c.json({
            success: false,
            error: 'Database error',
            details: error.message
        }, 500);
    }
});

// POST endpoint'ini üste taşı
router.post('/orders/:id/payment', async (c) => {
    const db = c.get('db');
    const { id } = c.req.param();
    const body = await c.req.json();
    
    try {
        // 1. Validasyon
        if (!body.amount || !body.payment_method || !body.account_id) {
            return c.json({
                success: false,
                error: 'Eksik bilgi: Tutar, ödeme yöntemi ve hesap gerekli'
            }, 400);
        }

        // 2. Siparişi kontrol et
        const order = await db.prepare(`
            SELECT total_amount, paid_amount, payment_status 
            FROM purchase_orders 
            WHERE id = ? AND deleted_at IS NULL
        `).bind(id).first();

        if (!order) {
            return c.json({
                success: false,
                error: 'Sipariş bulunamadı'
            }, 404);
        }

        // 3. Tutar kontrolü
        const remainingAmount = order.total_amount - (order.paid_amount || 0);
        if (body.amount > remainingAmount) {
            return c.json({
                success: false,
                error: 'Ödeme tutarı kalan tutardan büyük olamaz'
            }, 400);
        }

        // 4. Transaction kaydı oluştur
        await db.prepare(`
            INSERT INTO transactions (
                account_id,
                category_id,
                type,
                amount,
                date,
                related_type,
                related_id,
                payment_method,
                description,
                status,
                created_by
            ) VALUES (?, ?, 'out', ?, datetime('now'), 'purchase', ?, ?, ?, 'completed', ?)
        `).bind(
            body.account_id,
            4, // Tedarikçi Ödemesi kategorisi
            body.amount,
            id,
            body.payment_method,
            `Satın alma ödemesi #${id}`,
            1 // TODO: Gerçek user_id gelecek
        ).run();

        // 5. Purchase order güncelle 
        const newPaidAmount = (order.paid_amount || 0) + body.amount;
        const newStatus = newPaidAmount >= order.total_amount ? 'paid' : 
                         newPaidAmount > 0 ? 'partial' : 'pending';

        await db.prepare(`
            UPDATE purchase_orders 
            SET payment_status = ?, paid_amount = ?
            WHERE id = ?
        `).bind(newStatus, newPaidAmount, id).run();

        return c.json({
            success: true,
            new_status: newStatus,
            paid_amount: newPaidAmount
        });

    } catch (error) {
        console.error('Payment error:', error);
        return c.json({
            success: false,
            error: 'İşlem hatası',
            details: error.message
        }, 500);
    }
});

// Ödeme durumu güncelleme
// router.put('/orders/:id/payment', async (c) => {
//     const db = c.get('db');
//     const { id } = c.req.param();
//     const { status, amount } = await c.req.json();
    
//     try {
//         // Status kontrolü
//         if (!['paid', 'partial', 'cancelled'].includes(status)) {
//             return c.json({
//                 success: false,
//                 error: 'Invalid payment status'
//             }, 400);
//         }

//         // Mevcut siparişi kontrol et
//         const order = await db.prepare(`
//             SELECT total_amount, paid_amount 
//             FROM purchase_orders 
//             WHERE id = ? AND deleted_at IS NULL
//         `).bind(id).first();

//         if (!order) {
//             return c.json({
//                 success: false,
//                 error: 'Order not found'
//             }, 404);
//         }

//         let newPaidAmount = order.paid_amount || 0;
//         if (status === 'paid') {
//             newPaidAmount = order.total_amount;
//         } else if (status === 'partial' && amount) {
//             newPaidAmount += parseFloat(amount);
//         }

//         // Ödeme durumunu güncelle
//         await db.prepare(`
//             UPDATE purchase_orders 
//             SET 
//                 payment_status = ?,
//                 paid_amount = ?,
//                 updated_at = datetime('now')
//             WHERE id = ? AND deleted_at IS NULL
//         `).bind(status, newPaidAmount, id).run();

//         return c.json({ 
//             success: true,
//             paid_amount: newPaidAmount
//         });

//     } catch (error) {
//         console.error('Update payment status error:', error);
//         return c.json({
//             success: false,
//             error: 'Database error',
//             details: error.message
//         }, 500);
//     }
// });

export default router;
