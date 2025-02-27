import { Hono } from 'hono';

const router = new Hono();

// Tedarikçi listesi
router.get('/', async (c) => {
    const db = c.get('db');
    
    try {
        const { results } = await db.prepare(`
            SELECT 
                s.*,
                COUNT(DISTINCT po.id) as order_count,
                COALESCE(SUM(po.total_amount), 0) as total_purchases,
                MAX(po.order_date) as last_order_date
            FROM suppliers s
            LEFT JOIN purchase_orders po ON s.id = po.supplier_id 
                AND po.deleted_at IS NULL
            WHERE s.deleted_at IS NULL
            GROUP BY s.id
            ORDER BY s.name ASC
        `).all();
        
        return c.json({
            success: true,
            suppliers: results || []
        });
    } catch (error) {
        console.error('Suppliers list error:', error);
        return c.json({
            success: false,
            error: 'Database error',
            details: error.message
        }, 500);
    }
});

// Tedarikçi detayı
router.get('/:id', async (c) => {
    const db = c.get('db');
    const { id } = c.req.param();
    
    try {
        const supplier = await db.prepare(`
            SELECT * FROM suppliers 
            WHERE id = ? AND deleted_at IS NULL
        `).bind(id).first();

        if (!supplier) {
            return c.json({
                success: false,
                error: 'Supplier not found'
            }, 404);
        }

        // Son siparişleri getir
        const { results: orders } = await db.prepare(`
            SELECT 
                po.*,
                COUNT(poi.id) as item_count,
                COALESCE(SUM(poi.quantity * poi.unit_price), 0) as total_amount
            FROM purchase_orders po
            LEFT JOIN purchase_order_items poi ON po.id = poi.order_id 
                AND poi.deleted_at IS NULL
            WHERE po.supplier_id = ? 
            AND po.deleted_at IS NULL
            GROUP BY po.id
            ORDER BY po.order_date DESC
            LIMIT 10
        `).bind(id).all();

        return c.json({
            success: true,
            supplier,
            recent_orders: orders || []
        });

    } catch (error) {
        console.error('Supplier detail error:', error);
        return c.json({
            success: false,
            error: 'Database error',
            details: error.message
        }, 500);
    }
});

// Yeni tedarikçi ekle
router.post('/', async (c) => {
    const db = c.get('db');
    
    try {
        const body = await c.req.json();
        
        // Temel validasyon
        if (!body.name || !body.phone) {
            return c.json({
                success: false,
                error: 'Name and phone are required'
            }, 400);
        }

        const result = await db.prepare(`
            INSERT INTO suppliers (
                name, contact_name, phone, email,
                address, notes, status,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
            body.name,
            body.contact_name || null,
            body.phone,
            body.email || null,
            body.address || null,
            body.notes || null,
            body.status || 'active'
        ).run();

        return c.json({
            success: true,
            id: result.meta?.last_row_id
        });

    } catch (error) {
        console.error('Create supplier error:', error);
        return c.json({
            success: false,
            error: 'Database error',
            details: error.message
        }, 500);
    }
});

// Tedarikçi güncelle
router.put('/:id', async (c) => {
    const db = c.get('db');
    const { id } = c.req.param();
    
    try {
        const body = await c.req.json();
        
        // Status kontrolü
        if (body.status && !['active', 'passive', 'blacklist'].includes(body.status)) {
            return c.json({
                success: false,
                error: 'Invalid status'
            }, 400);
        }

        await db.prepare(`
            UPDATE suppliers 
            SET 
                name = COALESCE(?, name),
                contact_name = ?,
                phone = COALESCE(?, phone),
                email = ?,
                address = ?,
                notes = ?,
                status = COALESCE(?, status),
                updated_at = datetime('now')
            WHERE id = ? AND deleted_at IS NULL
        `).bind(
            body.name,
            body.contact_name,
            body.phone,
            body.email,
            body.address,
            body.notes,
            body.status,
            id
        ).run();

        return c.json({ success: true });

    } catch (error) {
        console.error('Update supplier error:', error);
        return c.json({
            success: false,
            error: 'Database error',
            details: error.message
        }, 500);
    }
});

// Tedarikçi sil (soft delete)
router.delete('/:id', async (c) => {
    const db = c.get('db');
    const { id } = c.req.param();
    
    try {
        await db.prepare(`
            UPDATE suppliers 
            SET 
                deleted_at = datetime('now'),
                status = 'passive'
            WHERE id = ? AND deleted_at IS NULL
        `).bind(id).run();

        return c.json({ success: true });

    } catch (error) {
        console.error('Delete supplier error:', error);
        return c.json({
            success: false,
            error: 'Database error',
            details: error.message
        }, 500);
    }
});

export default router;
