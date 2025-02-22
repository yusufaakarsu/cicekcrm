import { Hono } from 'hono'

const router = new Hono()

// Tedarikçi listesi
router.get('/', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    const { results } = await db.prepare(`
      SELECT 
        id, name, contact_name, phone, email,
        tax_number, address, status
      FROM suppliers
      WHERE tenant_id = ? 
      AND deleted_at IS NULL
      ORDER BY name
    `).bind(tenant_id).all()
    
    return c.json({
      success: true,
      suppliers: results
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Database error' 
    }, 500)
  }
})

// Yeni tedarikçi ekle
router.post('/', async (c) => {
  const body = await c.req.json()
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    const result = await db.prepare(`
      INSERT INTO suppliers (
        tenant_id, name, contact_name, phone,
        email, tax_number, address, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      tenant_id,
      body.name,
      body.contact_name,
      body.phone,
      body.email,
      body.tax_number,
      body.address,
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

// Tedarikçi güncelle
router.put('/:id', async (c) => {
  const { id } = c.req.param()
  const body = await c.req.json()
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    await db.prepare(`
      UPDATE suppliers 
      SET 
        name = ?,
        contact_name = ?,
        phone = ?,
        email = ?,
        tax_number = ?,
        address = ?,
        status = ?,
        updated_at = datetime('now')
      WHERE id = ? AND tenant_id = ?
    `).bind(
      body.name,
      body.contact_name,
      body.phone,
      body.email,
      body.tax_number,
      body.address,
      body.status,
      id,
      tenant_id
    ).run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Database error' 
    }, 500)
  }
})

// Tedarikçi sil
router.delete('/:id', async (c) => {
  const { id } = c.req.param()
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    await db.prepare(`
      UPDATE suppliers 
      SET deleted_at = datetime('now')
      WHERE id = ? AND tenant_id = ?
    `).bind(id, tenant_id).run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Database error' 
    }, 500)
  }
})

export default router
