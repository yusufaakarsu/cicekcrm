import { Hono } from 'hono';

const router = new Hono();

// Tüm ham maddeleri getir
router.get('/', async (c) => {
    const db = c.get('db');
    const tenant_id = c.get('tenant_id');

    try {
        const { results } = await db.prepare(`
            SELECT 
                m.*,
                u.name as unit_name,
                u.code as unit_code,
                COALESCE(
                    (SELECT SUM(
                        CASE WHEN movement_type = 'in' THEN quantity
                        ELSE -quantity END
                    ) FROM stock_movements 
                    WHERE material_id = m.id AND deleted_at IS NULL
                    ), 0
                ) as current_stock
            FROM raw_materials m
            LEFT JOIN units u ON m.unit_id = u.id
            WHERE m.tenant_id = ?
            AND m.deleted_at IS NULL
            ORDER BY m.name ASC
        `).bind(tenant_id).all();

        return c.json({
            success: true,
            materials: results
        });

    } catch (error) {
        console.error('Materials error:', error);
        return c.json({
            success: false,
            error: 'Database error',
            details: error.message
        }, 500);
    }
});

// Birimleri getir
router.get('/units', async (c) => {
    const db = c.get('db');
    const tenant_id = c.get('tenant_id');

    try {
        const { results } = await db.prepare(`
            SELECT id, name, code 
            FROM units 
            WHERE tenant_id = ? 
            AND deleted_at IS NULL
            ORDER BY name ASC
        `).bind(tenant_id).all();

        return c.json({
            success: true,
            units: results
        });

    } catch (error) {
        console.error('Units error:', error);
        return c.json({
            success: false,
            error: 'Database error'
        }, 500);
    }
});

// Yeni ham madde ekle
router.post('/', async (c) => {
    const db = c.get('db');
    const tenant_id = c.get('tenant_id');
    const user_id = c.get('user_id');

    try {
        const body = await c.req.json();
        const { name, unit_id, description, notes } = body;

        // Validasyon
        if (!name || !unit_id) {
            return c.json({
                success: false,
                error: 'Validation error'
            }, 400);
        }

        // Hammadde ekle
        const { success } = await db.prepare(`
            INSERT INTO raw_materials (
                tenant_id, name, unit_id, description, 
                notes, status, created_at
            ) VALUES (?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)
        `).bind(tenant_id, name, unit_id, description, notes).run();

        if (!success) throw new Error('Insert failed');

        return c.json({
            success: true,
            message: 'Material added successfully'
        });

    } catch (error) {
        console.error('Material insert error:', error);
        return c.json({
            success: false,
            error: 'Database error',
            details: error.message
        }, 500);
    }
});

export default router;
