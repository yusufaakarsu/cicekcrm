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

// Adres kaydetme endpoint'i düzeltildi
router.post('/', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    // Debug raw request
    const rawBody = await c.req.text();
    console.log('[DEBUG] Raw request body:', rawBody);
    
    // Try parsing manually
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      return c.json({
        success: false,
        error: 'JSON parse error',
        raw: rawBody,
        parse_error: e.message
      }, 400);
    }

    console.log('[DEBUG] Parsed body:', body);

    // Zorunlu alanları kontrol et
    const required = ['customer_id', 'label', 'city', 'district', 'street', 'building_no'];
    const missing = required.filter(field => !body[field]);
    
    if (missing.length > 0) {
      return c.json({
        success: false,
        error: 'Eksik veya hatalı bilgi',
        message: `Zorunlu alanlar eksik: ${missing.join(', ')}`,
        required,
        missing,
        received: body,
        debug: {
          content_type: c.req.header('content-type'),
          body_type: typeof body
        }
      }, 400);
    }

    // SQL sorgusunu düzelt
    const result = await db.prepare(`
      INSERT INTO addresses (
        tenant_id, customer_id, label,
        city, district, street, building_no,
        floor, apartment_no, postal_code,
        country_code, country_name,
        lat, lng, source, here_place_id,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATETIME('now'))
    `).bind(
      tenant_id,
      body.customer_id,
      body.label,
      body.city,
      body.district,
      body.street,
      body.building_no,
      body.floor || null,
      body.apartment_no || null,
      body.postal_code || null,
      body.country_code || 'TUR',
      body.country_name || 'Türkiye',
      body.lat || null,
      body.lng || null,
      body.source || 'manual',
      body.here_place_id || null
    ).run()

    const address_id = result.meta?.last_row_id;
    if (!address_id) {
      throw new Error('Adres ID alınamadı');
    }

    return c.json({
      success: true,
      address_id: address_id,
      message: 'Adres kaydedildi'
    });

  } catch (error) {
    console.error('[Adres Kayıt Hatası]:', error);
    return c.json({
      success: false, 
      error: 'Adres kaydedilemedi',
      message: error.message,
      debug: {
        error_type: error.constructor.name,
        stack: error.stack
      }
    }, 500);
  }
})

export default router