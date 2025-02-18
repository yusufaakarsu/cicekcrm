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

// Adres kaydetme endpoint'i
router.post('/', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    const body = await c.json();
    console.log('Gelen adres verisi:', body);

    // Validasyon ve hata kontrolü
    if (!body.customer_id) {
      return c.json({
        success: false,
        error: 'Müşteri ID gerekli'
      }, 400);
    }

    // Eğer varolan bir adres ID'si gönderildiyse, kayıt yapmadan onu dön
    if (body.existing_address_id) {
      return c.json({
        success: true,
        address_id: body.existing_address_id
      });
    }

    // Yeni adres için zorunlu alanları kontrol et
    if (!body.district || !body.street || !body.building_no) {
      return c.json({
        success: false,
        error: 'Eksik bilgi',
        required: ['district', 'street', 'building_no'],
        received: body
      }, 400);
    }

    // Adresi kaydet
    const result = await db.prepare(`
      INSERT INTO addresses (
        tenant_id, customer_id, label, city, district,
        street, building_no, floor, apartment_no,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, DATETIME('now'))
    `).bind(
      tenant_id,
      body.customer_id,
      body.label || 'Teslimat Adresi',
      body.city || 'İstanbul',
      body.district,
      body.street,
      body.building_no,
      body.floor || null,
      body.apartment_no || null
    ).run();

    // Debug için sonucu logla 
    console.log('DB Insert sonucu:', result);

    const insertedId = result.meta?.last_row_id || result.lastRowId;
    
    if (!insertedId) {
      throw new Error('Adres ID alınamadı');
    }

    // Başarılı
    return c.json({
      success: true,
      address_id: insertedId,
      message: 'Adres kaydedildi'
    })

  } catch (error) {
    console.error('Adres kayıt hatası:', error);
    return c.json({
      success: false,
      error: 'Adres kaydedilemedi: ' + error.message
    }, 500)
  }
})

export default router