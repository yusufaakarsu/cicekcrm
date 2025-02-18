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

// Adres kaydetme endpoint'i düzeltildi
router.post('/', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    const body = await c.json()
    console.log('[DEBUG] Gelen adres verisi:', body)

    // Validasyon
    if (!body.customer_id || !body.district || !body.street || !body.building_no) {
      return c.json({
        success: false,
        error: 'Eksik bilgi',
        required: ['customer_id', 'district', 'street', 'building_no'],
        received: body
      }, 400)
    }

    // Adres kaydı - güncellenmiş SQL ile tüm alanları içeriyor
    const result = await db.prepare(`
      INSERT INTO addresses (
        tenant_id, customer_id, 
        label, city, district, street,
        building_no, floor, apartment_no,
        postal_code, lat, lng,
        source, here_place_id, 
        country_code, country_name,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATETIME('now'))
    `).bind(
      tenant_id,
      body.customer_id,
      body.label || 'Teslimat Adresi',
      body.city || 'İstanbul',
      body.district.trim(),
      body.street.trim(),
      body.building_no.trim(),
      body.floor?.trim() || null,
      body.apartment_no?.trim() || null,
      body.postal_code || null,
      body.lat || null,
      body.lng || null,
      body.source || 'manual',
      body.here_place_id || null,
      body.country_code || 'TUR',
      body.country_name || 'Türkiye'
    ).run()

    const address_id = result.meta?.last_row_id
    if (!address_id) {
      throw new Error('Adres ID alınamadı')
    }

    return c.json({
      success: true,
      address_id: address_id,
      message: 'Adres kaydedildi'
    })

  } catch (error) {
    console.error('[Adres Kayıt Hatası]:', error)
    return c.json({
      success: false, 
      error: 'Adres kaydedilemedi',
      message: error.message
    }, 500)
  }
})

export default router