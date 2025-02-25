import { Hono } from 'hono';

const router = new Hono();

// Satın alma listesi
router.get('/orders', async (c) => {
    const db = c.get('db');
    const tenant_id = c.get('tenant_id');
    
    try {
        const supplier_id = c.req.query('supplier_id');
        const date = c.req.query('date');
        
        let sql = `
            SELECT 
                po.*,
                s.name as supplier_name,
                u.name as created_by_name,
                (
                    SELECT COALESCE(SUM(quantity * unit_price), 0) 
                    FROM purchase_order_items 
                    WHERE order_id = po.id 
                    AND deleted_at IS NULL
                ) as total_amount
            FROM purchase_orders po
            LEFT JOIN suppliers s ON po.supplier_id = s.id
            LEFT JOIN users u ON po.created_by = u.id
            WHERE po.tenant_id = ? 
            AND po.deleted_at IS NULL
        `;
        
        const params = [tenant_id];
        
        if (supplier_id) {
            sql += ' AND po.supplier_id = ?';
            params.push(supplier_id);
        }
        
        if (date) {
            sql += ' AND DATE(po.order_date) = DATE(?)';
            params.push(date);
        }
        
        sql += ' ORDER BY po.order_date DESC, po.id DESC';
        
        const { results } = await db.prepare(sql).bind(...params).all();
        
        return c.json({
            success: true,
            orders: results || []
        });
    } catch (error) {
        console.error('Database error:', error);
        return c.json({ 
            success: false, 
            error: 'Database error',
            message: error.message 
        }, 500);
    }
});

// Satın alma detayı
router.get('/orders/:id', async (c) => {
    const db = c.get('db');
    const tenant_id = c.get('tenant_id');
    const id = c.req.param('id');
    
    try {
        // Ana sipariş bilgileri
        const order = await db.prepare(`
            SELECT 
                po.*,
                s.name as supplier_name,
                u.name as created_by_name
            FROM purchase_orders po
            JOIN suppliers s ON po.supplier_id = s.id
            LEFT JOIN users u ON po.created_by = u.id
            WHERE po.id = ? AND po.tenant_id = ?
        `).bind(id, tenant_id).first();

        // Sipariş kalemleri
        const { results: items } = await db.prepare(`
            SELECT 
                poi.*,
                rm.name as material_name,
                rmc.name as category_name,
                u.name as unit_name,
                u.code as unit_code
            FROM purchase_order_items poi
            JOIN raw_materials rm ON poi.material_id = rm.id
            LEFT JOIN raw_material_categories rmc ON rm.category_id = rmc.id
            LEFT JOIN units u ON rm.unit_id = u.id
            WHERE poi.order_id = ?
            AND poi.deleted_at IS NULL
        `).bind(id).all();

        return c.json({
            success: true,
            order,
            items
        });
    } catch (error) {
        return c.json({ 
            success: false, 
            error: 'Database error' 
        }, 500);
    }
});

// Yeni satın alma ekle
router.post('/orders', async (c) => {
    const db = c.get('db');
    const tenant_id = c.get('tenant_id');
    const user_id = c.get('user_id') || 1;
    
    try {
        const data = await c.req.json();
        const { supplier_id, order_date, items } = data;

        console.log('Processing purchase order:', { supplier_id, order_date, items });

        // Validasyon
        if (!supplier_id || !order_date || !Array.isArray(items) || items.length === 0) {
            return c.json({
                success: false,
                error: 'Eksik ya da hatalı alanlar mevcut'
            }, 400);
        }

        // 1. Ana siparişi oluştur
        const orderResult = await db.prepare(`
            INSERT INTO purchase_orders (
                tenant_id, supplier_id, order_date, created_by, created_at
            ) VALUES (?, ?, ?, ?, datetime('now'))
        `).bind(
            tenant_id,
            supplier_id,
            order_date,
            user_id
        ).run();

        if (!orderResult.success) {
            throw new Error('Sipariş kaydı oluşturulamadı');
        }

        const order_id = orderResult.meta?.last_row_id;
        console.log('Created purchase order:', order_id);

        // 2. Kalemleri tek tek ekle
        for (const item of items) {
            console.log('Processing item:', item);

            if (!item.material_id || !item.quantity || !item.unit_price) {
                console.warn('Invalid item data:', item);
                continue;
            }

            await db.prepare(`
                INSERT INTO purchase_order_items (
                    order_id, 
                    material_id, 
                    quantity, 
                    unit_price,
                    created_at
                ) VALUES (?, ?, ?, ?, datetime('now'))
            `).bind(
                order_id,
                item.material_id,
                item.quantity,
                item.unit_price
            ).run();
        }

        // 3. Başarılı sonuç dön
        return c.json({
            success: true,
            order_id: order_id,
            message: 'Satın alma kaydı oluşturuldu'
        });

    } catch (error) {
        console.error('Purchase order error:', error);
        return c.json({ 
            success: false, 
            error: 'İşlem başarısız',
            message: error.message
        }, 500);
    }
});

export default router;
