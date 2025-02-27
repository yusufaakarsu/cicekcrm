import { Hono } from 'hono'

const router = new Hono()

// Stok listesi
router.get('/materials', async (c) => {
    const db = c.get('db')
    
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
        `).all()

        return c.json({
            success: true,
            materials: results || []
        })
    } catch (error) {
        console.error('Stock materials error:', error)
        return c.json({
            success: false,
            error: 'Database error',
            details: error.message
        }, 500)
    }
})

// Birim listesi
router.get('/units', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    const { results } = await db.prepare(`
      SELECT id, name, code
      FROM units
      WHERE tenant_id = ? 
      AND deleted_at IS NULL
      ORDER BY name
    `).bind(tenant_id).all()
    
    return c.json({
      success: true,
      units: results
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Database error' 
    }, 500)
  }
})

// Yeni ham madde ekle
router.post('/materials', async (c) => {
  const body = await c.req.json()
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    const result = await db.prepare(`
      INSERT INTO raw_materials (
        tenant_id, name, unit_id, min_stock,
        description, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      tenant_id,
      body.name,
      body.unit_id,
      body.min_stock || null,
      body.description,
      body.status || 'active'
    ).run()

    return c.json({
      success: true,
      id: result.meta?.last_row_id
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Database error' 
    }, 500)
  }
})

// Stok hareketi ekle
router.post('/movements', async (c) => {
    const db = c.get('db')
    
    try {
        const body = await c.req.json()
        
        // Temel validasyon
        if (!body.material_id || !body.quantity || !body.movement_type || !body.source_type) {
            return c.json({
                success: false,
                error: 'Missing required fields'
            }, 400)
        }

        const result = await db.prepare(`
            INSERT INTO stock_movements (
                material_id, movement_type, quantity,
                source_type, source_id, notes,
                created_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).bind(
            body.material_id,
            body.movement_type,
            body.quantity,
            body.source_type,
            body.source_id || null,
            body.notes || null,
            1 // TODO: Gerçek user ID gelecek
        ).run()

        return c.json({
            success: true,
            movement_id: result.meta?.last_row_id
        })
    } catch (error) {
        console.error('Stock movement error:', error)
        return c.json({
            success: false,
            error: 'Database error',
            details: error.message
        }, 500)
    }
})

// Stok hareketleri listesi
router.get('/movements/:materialId', async (c) => {
    const db = c.get('db')
    const { materialId } = c.req.param()
    
    try {
        const { results } = await db.prepare(`
            SELECT 
                sm.*,
                m.name as material_name,
                u.code as unit_code,
                users.name as created_by_name
            FROM stock_movements sm
            LEFT JOIN raw_materials m ON sm.material_id = m.id
            LEFT JOIN units u ON m.unit_id = u.id
            LEFT JOIN users ON sm.created_by = users.id
            WHERE sm.material_id = ?
            AND sm.deleted_at IS NULL
            ORDER BY sm.created_at DESC
            LIMIT 50
        `).bind(materialId).all()

        return c.json({
            success: true,
            movements: results || []
        })
    } catch (error) {
        console.error('Stock movements error:', error)
        return c.json({
            success: false,
            error: 'Database error',
            details: error.message
        }, 500)
    }
})

export default router
