import { Hono } from 'hono';

const router = new Hono();

// Ham maddeleri getir (filtreleme destekli)
router.get('/', async (c) => {
    const db = c.get('db');
    const tenant_id = c.get('tenant_id');

    try {
        const url = new URL(c.req.url);
        const search = url.searchParams.get('search') || '';
        const category = url.searchParams.get('category') || '';
        const status = url.searchParams.get('status') || '';

        let sql = `
            SELECT 
                m.*,
                c.name as category_name,
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
            LEFT JOIN raw_material_categories c ON m.category_id = c.id
            LEFT JOIN units u ON m.unit_id = u.id
            WHERE m.tenant_id = ?
            AND m.deleted_at IS NULL
        `;

        const params = [tenant_id];

        if (search) {
            sql += ` AND m.name LIKE ?`;
            params.push(`%${search}%`);
        }

        if (category) {
            sql += ` AND m.category_id = ?`;
            params.push(category);
        }

        if (status) {
            sql += ` AND m.status = ?`;
            params.push(status);
        }

        sql += ` ORDER BY m.name ASC`;

        const { results } = await db.prepare(sql).bind(...params).all();

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

// Kategorileri getir
router.get('/categories', async (c) => {
    const db = c.get('db');
    const tenant_id = c.get('tenant_id');

    try {
        const { results } = await db.prepare(`
            SELECT id, name, description, display_order, status
            FROM raw_material_categories 
            WHERE tenant_id = ? 
            AND deleted_at IS NULL
            ORDER BY display_order ASC, name ASC
        `).bind(tenant_id).all();

        return c.json({
            success: true,
            categories: results
        });

    } catch (error) {
        console.error('Categories error:', error);
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
        const { name, unit_id, category_id, description, notes } = body;

        // Validasyon
        if (!name || !unit_id) {
            return c.json({
                success: false,
                error: 'Validation error - Required fields missing'
            }, 400);
        }

        // Kategori kontrolü
        if (category_id) {
            const { count } = await db.prepare(`
                SELECT COUNT(*) as count 
                FROM raw_material_categories 
                WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL
            `).bind(category_id, tenant_id).first();

            if (!count) {
                return c.json({
                    success: false,
                    error: 'Invalid category'
                }, 400);
            }
        }

        // Hammadde ekle
        const { success } = await db.prepare(`
            INSERT INTO raw_materials (
                tenant_id, name, unit_id, category_id,
                description, notes, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)
        `).bind(tenant_id, name, unit_id, category_id, description, notes).run();

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
