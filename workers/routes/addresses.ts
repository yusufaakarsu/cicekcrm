import { Hono } from 'hono'

const router = new Hono()

// Adres listesi
router.get('/', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    const { results } = await db.prepare(`
      SELECT * FROM addresses
      WHERE tenant_id = ?
      ORDER BY created_at DESC
    `).bind(tenant_id).all()
    
    return c.json(results || [])
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// Yeni adres ekle
router.post('/', async (c) => {
  const body = await c.req.json()
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    const addressData = {
      tenant_id,
      label: body.label,
      country_code: 'TUR',
      country_name: 'Türkiye',
      city: body.city || 'İstanbul',
      district: body.district,
      postal_code: body.postal_code,
      street: body.street || null,
      building_no: body.building_no || null,
      lat: body.position?.lat,
      lng: body.position?.lng,
      source: body.source || 'here_api',
      here_place_id: body.here_place_id
    }

    const result = await db.prepare(`
      INSERT INTO addresses (
        tenant_id, label, country_code, country_name,
        city, district, postal_code, street, building_no,
        lat, lng, source, here_place_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      tenant_id,
      addressData.label,
      addressData.country_code,
      addressData.country_name,
      addressData.city,
      addressData.district,
      addressData.postal_code,
      addressData.street,
      addressData.building_no,
      addressData.lat,
      addressData.lng,
      addressData.source,
      addressData.here_place_id
    ).run()

    return c.json({
      success: true,
      id: result.lastRowId,
      data: addressData
    })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

export default router
