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

// Adres ekleme endpointi - Alıcı ilişkisi için güncellendi
router.post('/', async (c) => {
  const db = c.get('db');
  
  try {
    const body = await c.req.json();
    console.log("Adres oluşturma isteği:", body);
    
    // Önce alıcı kaydı oluştur veya mevcut alıcıyı bul
    let recipientId = null;
    if (body.recipient_name && body.recipient_phone) {
      // Aynı telefon numarası ile kayıtlı alıcı var mı kontrol et
      const existingRecipient = await db.prepare(`
        SELECT id FROM recipients 
        WHERE phone = ? AND customer_id = ? AND deleted_at IS NULL
      `).bind(body.recipient_phone, body.customer_id).first();
      
      if (existingRecipient) {
        recipientId = existingRecipient.id;
      } else {
        // Yoksa yeni alıcı kaydı oluştur
        const recipientResult = await db.prepare(`
          INSERT INTO recipients (
            customer_id, name, phone, notes
          ) VALUES (?, ?, ?, ?)
        `).bind(
          body.customer_id,
          body.recipient_name,
          body.recipient_phone,
          body.recipient_note || null
        ).run();
        
        recipientId = recipientResult.meta?.last_row_id;
      }
    }
    
    // Şimdi adresi kaydet - recipient_id alanını da doldurarak
    const result = await db.prepare(`
      INSERT INTO addresses (
        customer_id, 
        recipient_id,
        label, 
        district,
        street, 
        building_no, 
        floor_no, 
        door_no,
        here_place_id, 
        lat, 
        lng,
        neighborhood,
        directions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.customer_id,
      recipientId,  // recipient_id alanını dolduruyoruz
      body.label || 'Teslimat Adresi',
      body.district,
      body.street,
      body.building_no || '1',
      body.floor_no || '1',
      body.door_no || '1',
      body.here_place_id || null,
      body.lat || null,
      body.lng || null,
      body.neighborhood || null,
      body.directions || null
    ).run();
    
    const address_id = result.meta?.last_row_id;
    
    if (!address_id) {
      return c.json({
        success: false,
        error: "Could not create address"
      }, 500);
    }
    
    return c.json({
      success: true,
      address_id,
      recipient_id: recipientId
    });
    
  } catch (error) {
    console.error('Address creation error:', error);
    return c.json({
      success: false,
      error: 'Database error',
      details: error.message
    }, 500);
  }
});

export default router