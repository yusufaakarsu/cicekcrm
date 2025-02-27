import { Hono } from 'hono';

const router = new Hono();

// Hammadde kategorileri
router.get('/categories', async (c) => {
    const db = c.get('db');
    
    try {
        const { results } = await db.prepare(`
            SELECT 
                c.*,
                COUNT(m.id) as material_count
            FROM raw_material_categories c
            LEFT JOIN raw_materials m ON c.id = m.category_id 
                AND m.deleted_at IS NULL
            WHERE c.deleted_at IS NULL
            GROUP BY c.id
            ORDER BY c.display_order, c.name
        `).all();
        
        return c.json({
            success: true,
            categories: results || []
        });
    } catch (error) {
        return c.json({
            success: false,
            error: 'Database error',
            details: error.message
        }, 500);
    }
});

// Hammadde listesi
router.get('/', async (c) => {
    const db = c.get('db');
    
    try {
        const { results } = await db.prepare(`
            SELECT 
                m.*,
                c.name as category_name,
                u.name as unit_name,
                u.code as unit_code,
                COALESCE(s.total_in, 0) - COALESCE(s.total_out, 0) as current_stock
            FROM raw_materials m
            LEFT JOIN raw_material_categories c ON m.category_id = c.id
            LEFT JOIN units u ON m.unit_id = u.id
            LEFT JOIN (
                SELECT 
                    material_id,
                    SUM(CASE WHEN movement_type = 'in' THEN quantity ELSE 0 END) as total_in,
                    SUM(CASE WHEN movement_type = 'out' THEN quantity ELSE 0 END) as total_out
                FROM stock_movements
                WHERE deleted_at IS NULL
                GROUP BY material_id
            ) s ON m.id = s.material_id
            WHERE m.deleted_at IS NULL
            ORDER BY c.display_order, m.name
        `).all();
        
        return c.json({
            success: true,
            materials: results || []
        });
    } catch (error) {
        return c.json({
            success: false,
            error: 'Database error',
            details: error.message
        }, 500);
    }
});

// Hammadde detayı
router.get('/:id', async (c) => {
    const db = c.get('db');
    const { id } = c.req.param();
    
    try {
        // Temel bilgiler
        const material = await db.prepare(`
            SELECT 
                m.*,
                c.name as category_name,
                u.name as unit_name,
                u.code as unit_code
            FROM raw_materials m
            LEFT JOIN raw_material_categories c ON m.category_id = c.id
            LEFT JOIN units u ON m.unit_id = u.id
            WHERE m.id = ? AND m.deleted_at IS NULL
        `).bind(id).first();

        if (!material) {
            return c.json({
                success: false,
                error: 'Material not found'
            }, 404);
        }

        // Stok hareketleri
        const { results: movements } = await db.prepare(`
            SELECT 
                sm.*,
                u.name as created_by_name
            FROM stock_movements sm
            LEFT JOIN users u ON sm.created_by = u.id
            WHERE sm.material_id = ? 
            AND sm.deleted_at IS NULL
            ORDER BY sm.created_at DESC
            LIMIT 10
        `).bind(id).all();

        // Kullanıldığı ürünler
        const { results: products } = await db.prepare(`
            SELECT 
                p.id,
                p.name,
                pm.default_quantity,
                u.code as unit_code
            FROM product_materials pm
            LEFT JOIN products p ON pm.product_id = p.id
            LEFT JOIN raw_materials m ON pm.material_id = m.id
            LEFT JOIN units u ON m.unit_id = u.id
            WHERE pm.material_id = ?
            AND pm.deleted_at IS NULL
            AND p.deleted_at IS NULL
        `).bind(id).all();

        return c.json({
            success: true,
            material,
            movements: movements || [],
            products: products || []
        });

    } catch (error) {
        return c.json({
            success: false,
            error: 'Database error',
            details: error.message
        }, 500);
    }
});

// Hammadde ekle
router.post('/', async (c) => {
    const db = c.get('db');
    
    try {
        const body = await c.req.json();
        
        // Validasyon
        if (!body.name || !body.unit_id) {
            return c.json({
                success: false,
                error: 'Name and unit are required'
            }, 400);
        }

        // Sadece var olan kolonları kullan ve status'u active olarak ayarla
        const result = await db.prepare(`
            INSERT INTO raw_materials (
                name, 
                description,
                unit_id, 
                category_id, 
                status,
                notes
            ) VALUES (?, ?, ?, ?, 'active', ?)
        `).bind(
            body.name,
            body.description || null,
            body.unit_id,
            body.category_id || null,
            body.notes || null
        ).run();

        return c.json({
            success: true,
            id: result.meta?.last_row_id
        });

    } catch (error) {
        console.error('Create material error:', error);
        return c.json({
            success: false,
            error: 'Database error'
        }, 500);
    }
});

// Kategori ekle
router.post('/categories', async (c) => {
    const db = c.get('db');
    
    try {
        const body = await c.req.json();
        
        if (!body.name) {
            return c.json({
                success: false,
                error: 'Name is required'
            }, 400);
        }

        const result = await db.prepare(`
            INSERT INTO raw_material_categories (
                name, description, display_order, status,
                created_at
            ) VALUES (?, ?, ?, ?, datetime('now'))
            RETURNING *
        `).bind(
            body.name,
            body.description || null,
            body.display_order || 0,
            body.status || 'active'
        ).run();

        return c.json({
            success: true,
            category: result.meta?.last_row_id
        });

    } catch (error) {
        console.error('Create category error:', error);
        return c.json({
            success: false,
            error: 'Database error',
            details: error.message
        }, 500);
    }
});

// Hammadde güncelle
router.put('/:id', async (c) => {
    const db = c.get('db');
    const { id } = c.req.param();
    
    try {
        const body = await c.req.json();

        await db.prepare(`
            UPDATE raw_materials 
            SET 
                name = COALESCE(?, name),
                description = ?,
                unit_id = COALESCE(?, unit_id),
                category_id = ?,
                status = COALESCE(?, status),
                notes = ?
            WHERE id = ? AND deleted_at IS NULL
        `).bind(
            body.name,
            body.description,
            body.unit_id,
            body.category_id,
            body.status,
            body.notes,
            id
        ).run();

        return c.json({ success: true });

    } catch (error) {
        return c.json({
            success: false,
            error: 'Database error',
            details: error.message
        }, 500);
    }
});

export default router;
