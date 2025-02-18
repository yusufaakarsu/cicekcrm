
import { Hono } from 'hono'

const router = new Hono()

// Tüm müşterileri listele
router.get('/', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  try {
    const { results } = await db.prepare(`
      SELECT 
        c.*,
        COUNT(DISTINCT o.id) as total_orders,
        MAX(o.created_at) as last_order,
        COALESCE(SUM(o.total_amount), 0) as total_spent
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id AND o.is_deleted = 0
      WHERE c.tenant_id = ?
      AND c.is_deleted = 0
      GROUP BY c.id
      ORDER BY c.name
    `).bind(tenant_id).all()
    
    return c.json(results)
  } catch (error) {
    console.error('Customers list error:', error)
    return c.json({ 
      success: false,
      error: 'Database error',
      message: error.message 
    }, 500)
  }
})

// Telefon ile müşteri ara
router.get('/phone/:phone', async (c) => {
  try {
    const phone = c.req.param('phone').replace(/\D/g, '').replace(/^0+/, '')
    const db = c.get('db')
    const tenant_id = c.get('tenant_id')
    
    const customer = await db.prepare(`
        SELECT * FROM customers 
        WHERE phone = ? 
        AND tenant_id = ? 
        AND is_deleted = 0
    `).bind(phone, tenant_id).first()
    
    return c.json({
        success: true,
        customer: customer || null
    })
  } catch (error) {
    return c.json({
        success: false,
        message: 'Müşteri araması başarısız',
        error: error.message
    })
  }
})

// Yeni müşteri ekle - Güncellendi
router.post("/", async (c) => {
  const body = await c.req.json();
  const db = c.get("db");
  const tenant_id = c.get("tenant_id");
  
  try {
      const phone = body.phone.replace(/\D/g, "");
      
      // Temel validasyon
      if (!body.name || !phone || !body.district) {
          return c.json({
              success: false,
              error: "Ad, telefon ve ilçe alanları zorunludur"
          }, 400);
      }

      // Telefon kontrolü
      const existing = await db.prepare(`
          SELECT id FROM customers WHERE phone = ? AND tenant_id = ? AND is_deleted = 0
      `).bind(phone, tenant_id).first();

      if (existing) {
          return c.json({
              success: false,
              error: "Bu telefon numarası zaten kayıtlı",
              id: existing.id
          }, 400);
      }

      // Müşteri ekleme - SQL sorgusu düzeltildi
      const result = await db.prepare(`
          INSERT INTO customers (
              tenant_id, name, phone, email, city, district, 
              customer_type, notes, special_dates, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
          tenant_id,
          body.name,
          phone,
          body.email || null,
          body.city || "İstanbul",
          body.district,
          body.customer_type || "retail",
          body.notes || null,
          body.special_dates || null
      ).run();

      // meta.last_row_id kontrol edilmeli
      if (!result.meta?.last_row_id) {
          throw new Error("Müşteri kaydı oluşturulamadı");
      }

      // Yeni eklenen müşteriyi getir
      const customer = await db.prepare(`
          SELECT * FROM customers WHERE id = ?
      `).bind(result.meta.last_row_id).first();

      return c.json({
          success: true,
          customer: customer,
          id: result.meta.last_row_id
      });

  } catch (error) {
      console.error("Müşteri kayıt hatası:", error);
      return c.json({
          success: false,
          error: "Müşteri kaydedilemedi",
          message: error.message
      }, 500);
  }
});

// Müşteri detayı
router.get('/:id', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  const { id } = c.req.param()
  
  try {
    const customer = await db.prepare(`
      SELECT 
        c.*,
        COUNT(o.id) as total_orders,
        MAX(o.created_at) as last_order,
        SUM(o.total_amount) as total_spent
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id AND o.is_deleted = 0
      WHERE c.id = ?
      AND c.tenant_id = ?
      AND c.is_deleted = 0
      GROUP BY c.id
    `).bind(id, tenant_id).first()

    if (!customer) {
      return c.json({ error: 'Customer not found' }, 404)
    }

    return c.json(customer)
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// Müşteri güncelle
router.put('/:id', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  const { id } = c.req.param()
  const body = await c.req.json()
  
  try {
    const result = await db.prepare(`
      UPDATE customers 
      SET 
        name = ?, phone = ?, email = ?, 
        address = ?, city = ?, district = ?,
        customer_type = ?, company_name = ?, tax_number = ?,
        special_dates = ?, notes = ?,
        updated_at = DATETIME('now')
      WHERE id = ? AND tenant_id = ? AND is_deleted = 0
    `).bind(
      body.name, body.phone, body.email,
      body.address, body.city, body.district,
      body.customer_type, body.company_name, body.tax_number,
      body.special_dates, body.notes,
      id, tenant_id
    ).run()

    if (result.changes === 0) {
      return c.json({ error: 'Customer not found or no changes made' }, 404)
    }

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// Müşteri siparişleri
router.get('/:id/orders', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  const { id } = c.req.param()
  
  try {
    const { results } = await db.prepare(`
      SELECT 
        o.*,
        GROUP_CONCAT(oi.quantity || 'x ' || p.name) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.customer_id = ?
      AND o.tenant_id = ?
      AND o.is_deleted = 0
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `).bind(id, tenant_id).all()

    return c.json(results || [])
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// Müşteri adresleri
router.get('/:id/addresses', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  const { id } = c.req.param()
  
  try {
    const { results } = await db.prepare(`
      SELECT * FROM addresses 
      WHERE customer_id = ?
      AND tenant_id = ?
      AND is_deleted = 0
      ORDER BY is_default DESC, created_at DESC
    `).bind(id, tenant_id).all()
    
    return c.json(results || [])
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

export default router
