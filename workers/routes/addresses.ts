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
    "title": "2305. Sokak, 34515, Piri Reis, Esenyurt/İstanbul, Türkiye",
    "id": "here:af:streetsection:sRJpxGSyiXG6WTI566aVQA",
    "resultType": "street",
    "address": {
        "label": "2305. Sokak, 34515, Piri Reis, Esenyurt/İstanbul, Türkiye",
        "countryCode": "TUR",
        "countryName": "Türkiye",
        "county": "İstanbul",
        "city": "Esenyurt",
        "district": "Piri Reis",
        "street": "2305. Sokak",
        "postalCode": "34515"
    },
    "position": {
        "lat": 41.02226,
        "lng": 28.64717
    },
    "mapView": {
        "west": 28.64641,
        "south": 41.02122,
        "east": 28.64752,
        "north": 41.02341
    },
    "scoring": {
        "queryScore": 0.99,
        "fieldScore": {
            "county": 1,
            "streets": [
                0.9
            ]
        }
    }
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

// Yeni adres ekle - Hata ayıklama eklendi
router.post('/', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    const body = await c.req.json()
    console.log('Gelen adres verisi:', body) // Debug log

    // Zorunlu alanları kontrol et
    const required = ['customer_id', 'district', 'street', 'building_no']
    for (const field of required) {
      if (!body[field]) {
        return c.json({
          success: false,
          error: `${field} alanı zorunludur`,
          received: body
        }, 400)
      }
    }

    // SQL hata ayıklama
    const sql = `
      INSERT INTO addresses (
        tenant_id, customer_id, label, 
        district, neighborhood, street,
        building_no, floor_no, door_no, 
        here_place_id, lat, lng,
        directions, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `
    console.log('SQL:', sql) // Debug log
    console.log('Params:', [
      tenant_id,
      body.customer_id,
      body.label,
      body.district,
      body.neighborhood,
      body.street,
      body.building_no,
      body.floor,
      body.apartment_no,
      body.here_place_id,
      body.lat,
      body.lng,
      body.directions
    ]) // Debug log

    const result = await db.prepare(sql).bind(
      tenant_id,
      body.customer_id,
      body.label || 'Teslimat Adresi',
      body.district,
      body.neighborhood || null,
      body.street,
      body.building_no,
      body.floor, // floor -> floor_no
      body.apartment_no, // apartment_no -> door_no 
      body.here_place_id,
      body.lat,
      body.lng,
      body.directions || null
    ).run()

    return c.json({
      success: true,
      address_id: result.meta?.last_row_id
    })

  } catch (error) {
    console.error('Address save error:', error) // Debug log
    return c.json({
      success: false,
      error: 'Database error',
      details: error.message,
      stack: error.stack
    }, 500)
  }
})

export default router