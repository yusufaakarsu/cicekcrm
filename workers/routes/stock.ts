import { Hono } from 'hono'

const router = new Hono()

// Ham madde listesi
router.get('/materials', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    console.log('Getting materials for tenant:', tenant_id); // Debug log

    const query = `
      SELECT 
        rm.*,
        u.name as unit_name,
        u.code as unit_code,
        (
          SELECT created_at
          FROM stock_movements 
          WHERE material_id = rm.id 
          AND tenant_id = rm.tenant_id 
          AND deleted_at IS NULL 
          ORDER BY created_at DESC 
          LIMIT 1
        ) as last_movement,
        COALESCE(
          (SELECT SUM(CASE WHEN sm.movement_type = 'in' THEN sm.quantity ELSE -sm.quantity END)
           FROM stock_movements sm 
           WHERE sm.material_id = rm.id 
           AND sm.tenant_id = rm.tenant_id
           AND sm.deleted_at IS NULL
          ), 0
        ) as current_stock
      FROM raw_materials rm
      LEFT JOIN units u ON rm.unit_id = u.id
      WHERE rm.tenant_id = ? AND rm.deleted_at IS NULL
      ORDER BY rm.name
    `;

    console.log('Executing query:', query); // Debug log
    
    const { results } = await db.prepare(query).bind(tenant_id).all()
    
    console.log('Query results:', results); // Debug log
    
    return c.json({
      success: true,
      materials: results || []  // Null check ekledik
    })
  } catch (error) {
    console.error('Database error:', error); // Hata detayını görelim
    return c.json({ 
      success: false, 
      error: 'Database error',
      details: error.message // Hata detayını ekledik
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
  const body = await c.req.json()
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  const user_id = c.get('user_id')
  
  try {
    const result = await db.prepare(`
      INSERT INTO stock_movements (
        tenant_id, material_id, movement_type,
        quantity, source_type, notes,
        created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      tenant_id,
      body.material_id,
      body.movement_type,
      body.quantity,
      body.source_type,
      body.notes,
      user_id
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

// Hareket geçmişini getir
router.get('/movements/:material_id', async (c) => {
  const { material_id } = c.req.param()
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    const { results } = await db.prepare(`
      SELECT 
        sm.*,
        u.name as created_by_name
      FROM stock_movements sm
      LEFT JOIN users u ON sm.created_by = u.id
      WHERE sm.material_id = ?
      AND sm.tenant_id = ?
      AND sm.deleted_at IS NULL
      ORDER BY sm.created_at DESC
      LIMIT 50
    `).bind(material_id, tenant_id).all()
    
    return c.json({
      success: true,
      movements: results
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Database error' 
    }, 500)
  }
})

export default router
