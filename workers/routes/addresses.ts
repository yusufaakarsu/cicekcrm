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

// Yeni adres ekle - Column mapping düzeltildi
router.post('/', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    const body = await c.req.json()
    
    // Debug için gelen veriyi logla
    console.log('Received body:', JSON.stringify(body, null, 2));

    // Adres validasyonu
    if (!body.customer_id || !body.district || !body.street) {
      return c.json({
        success: false,
        error: 'Missing required fields',
        required: ['customer_id', 'district', 'street']
      }, 400)
    }

    // SQL sorgusunu düzenle - Kolonları doğru sırala
    const result = await db.prepare(`
      INSERT INTO addresses (
        tenant_id,         -- 1
        customer_id,       -- 2 
        label,            -- 3
        district,         -- 4
        street,           -- 5
        building_no,      -- 6
        floor_no,         -- 7
        door_no,          -- 8
        here_place_id,    -- 9
        lat,             -- 10
        lng,             -- 11
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      tenant_id,                              // 1
      body.customer_id,                       // 2
      body.label || 'Teslimat Adresi',       // 3
      body.district,                          // 4
      body.street,                            // 5
      body.building_no,                       // 6
      body.floor_no,                          // 7
      body.door_no,                           // 8
      body.here_place_id,                     // 9
      body.lat,                              // 10
      body.lng                               // 11
    ).run()

    if (!result.success) {
      throw new Error('Address insert failed')
    }

    // Başarılı response
    return c.json({
      success: true,
      address_id: result.meta?.last_row_id
    })

  } catch (error) {
    // Hata detaylarını logla
    console.error('Address save error:', {
      error: error.message,
      stack: error.stack,
      body: body
    })

    return c.json({
      success: false,
      error: 'Database error',
      message: error.message
    }, 500)
  }
})

export default router