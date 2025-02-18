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

/* HERE API Response örneği:
{
  "items": [{
    "title": "Ataşehir, İstanbul, Türkiye",
    "id": "here:pds:place:792j4hfe-8a3d12ba...",  // here_place_id
    "resultType": "district",
    "address": {
      "city": "İstanbul",
      "district": "Ataşehir",
      "postalCode": "34704",
      "street": "Atatürk Mahallesi",
      "countryCode": "TUR",
      "countryName": "Türkiye"
    },
    "position": {
      "lat": 40.9909,    // lat
      "lng": 29.1207     // lng
    }
  }]
}
*/

// Adres kayıt fonksiyonu
async function saveAddress(c) {
    const body = await c.req.json();
    const hereAddress = body.address;

    const addressData = {
        tenant_id: c.get('tenant_id'),
        customer_id: body.customer_id,
        label: body.label || 'Yeni Adres',
        country_code: hereAddress.address.countryCode,    // HERE API'den
        country_name: hereAddress.address.countryName,    // HERE API'den
        city: hereAddress.address.city,                   // HERE API'den
        district: hereAddress.address.district,           // HERE API'den
        postal_code: hereAddress.address.postalCode,      // HERE API'den
        street: hereAddress.address.street,               // HERE API'den
        building_no: body.building_no,                    // Manuel girilecek
        lat: hereAddress.position.lat,                    // HERE API'den
        lng: hereAddress.position.lng,                    // HERE API'den
        source: 'here_api',
        here_place_id: hereAddress.id                    // HERE API'den
    };

    // ...save to database code...
}

// Yeni adres ekle
router.post('/', async (c) => {
  const body = await c.req.json()
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    const addressData = {
      tenant_id,
      customer_id: body.customer_id,
      label: body.label,
      country_code: 'TUR',
      country_name: 'Türkiye',
      city: body.city || 'İstanbul',
      district: body.district,
      postal_code: body.postal_code,
      street: body.street || null,
      building_no: body.building_no || null,
      floor: body.floor || null,           // Kat bilgisi eklendi
      apartment_no: body.apartment_no || null,  // Daire no eklendi
      lat: body.position?.lat,
      lng: body.position?.lng,
      source: body.source || 'manual',
      here_place_id: body.here_place_id
    }

    const result = await db.prepare(`
      INSERT INTO addresses (
        tenant_id, customer_id, label, country_code, country_name,
        city, district, postal_code, street, building_no,
        floor, apartment_no, lat, lng, source, here_place_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      tenant_id,
      addressData.customer_id,
      addressData.label,
      addressData.country_code,
      addressData.country_name,
      addressData.city,
      addressData.district,
      addressData.postal_code,
      addressData.street,
      addressData.building_no,
      addressData.floor,          // Kat bilgisi eklendi
      addressData.apartment_no,   // Daire no eklendi
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
