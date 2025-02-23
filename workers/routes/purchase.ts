import { Hono } from 'hono';

const router = new Hono();

// Satın alma listesi
router.get('/orders', async (c) => {
    const db = c.get('db');
    const tenant_id = c.get('tenant_id');
    
    try {
        const { results } = await db.prepare(`
            SELECT 
                po.*,
                s.name as supplier_name,
                u.name as created_by_name,
                (SELECT COALESCE(SUM(quantity * unit_price), 0) 
                 FROM purchase_order_items 
                 WHERE order_id = po.id AND deleted_at IS NULL) as total_amount
            FROM purchase_orders po
            LEFT JOIN suppliers s ON po.supplier_id = s.id
            LEFT JOIN users u ON po.created_by = u.id
            WHERE po.tenant_id = ? 
            AND po.deleted_at IS NULL
            ORDER BY po.created_at DESC
        `).bind(tenant_id).all();
        
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
        const { supplier_id, order_date, notes, items } = data;

        console.log('Request data:', { supplier_id, order_date, notes, items });

        // Validasyon
        if (!supplier_id || !order_date || !Array.isArray(items) || items.length === 0) {
            return c.json({
                success: false,
                error: 'Missing or invalid required fields'
            }, 400);
        }

        // Ana siparişi oluştur
        const orderResult = await db.prepare(`
            INSERT INTO purchase_orders (
                tenant_id, supplier_id, order_date, 
                notes, created_by
            ) VALUES (?, ?, ?, ?, ?)
        `).bind(
            tenant_id,
            supplier_id,
            order_date,
            notes || null,
            user_id
        ).run();

        const order_id = orderResult.lastRowId;

        // Kalemleri ekle
        for (const item of items) {
            if (!item.material_id || !item.quantity || !item.unit_price) {
                continue; // Hatalı kalemleri atla
            }

            await db.prepare(`
                INSERT INTO purchase_order_items (
                    order_id, material_id, quantity,
                    unit_price, notes
                ) VALUES (?, ?, ?, ?, ?)
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
            order_id,
            message: 'Purchase order created successfully'
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

export default router;
