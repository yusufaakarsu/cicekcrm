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
        
        // Temel validasyon
        if (!body.supplier_id || !body.items?.length) {
            return c.json({
                success: false,
                error: 'Missing required fields'
            }, 400);
        }

        // Siparişi oluştur
        const result = await db.prepare(`
            INSERT INTO purchase_orders (
                supplier_id, order_date, notes,
                payment_status, total_amount,
                created_by, created_at, updated_at
            ) VALUES (?, date('now'), ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
            body.supplier_id,
            body.notes || null,
            body.payment_status || 'pending',
            body.total_amount || 0,
            1 // TODO: Gerçek user ID
        ).run();

        const order_id = result.meta?.last_row_id;
        if (!order_id) throw new Error('Order could not be created');

        // Sipariş kalemlerini ekle
        for (const item of body.items) {
            await db.prepare(`
                INSERT INTO purchase_order_items (
                    order_id, material_id, quantity,
                    unit_price, notes, created_at
                ) VALUES (?, ?, ?, ?, ?, datetime('now'))
            `).bind(
                order_id,
                item.material_id,
                item.quantity,
                item.unit_price,
                item.notes || null
            ).run();
        }

        return c.json({
            success: true,
            order_id: order_id
        });

    } catch (error) {
        console.error('Create purchase order error:', error);
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

export default router;
