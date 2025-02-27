import { Hono } from 'hono'

const router = new Hono()

// Müşteri listesi
router.get('/', async (c) => {
  const db = c.get('db')
  
  try {
    const { results } = await db.prepare(`
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM orders WHERE customer_id = c.id AND deleted_at IS NULL) as order_count,
        (SELECT COUNT(*) FROM recipients WHERE customer_id = c.id AND deleted_at IS NULL) as recipient_count,
        (SELECT COUNT(*) FROM addresses WHERE customer_id = c.id AND deleted_at IS NULL) as address_count
      FROM customers c
      WHERE c.deleted_at IS NULL
      ORDER BY c.name
    `).all()
    
    return c.json({
      success: true,
      customers: results
    })
  } catch (error) {
    console.error('Customer list error:', error)
    return c.json({ 
      success: false, 
      error: 'Database error',
      message: error.message 
    }, 500)
  }
})

// Telefon numarasına göre müşteri bulma
router.get('/phone/:phone', async (c) => {
    const db = c.get('db');
    const { phone } = c.req.param();
    
    try {
        const customer = await db.prepare(`
            SELECT * FROM customers
            WHERE phone = ?
            AND deleted_at IS NULL
        `).bind(phone).first();
        
        // Müşteri bulunamadığında uygun yanıt döndür
        if (!customer) {
            return c.json({
                success: false,
                error: "Customer not found",
                customer: null
            }, 404);  // 404 Not Found
        }
        
        return c.json({
            success: true,
            customer
        });
    } catch (error) {
        console.error('Error finding customer by phone:', error);
        return c.json({ 
            success: false, 
            error: 'Database error',
            details: error.message
        }, 500);
    }
});

// Yeni müşteri kaydet
router.post('/', async (c) => {
  const db = c.get('db')
  const body = await c.req.json()
  
  try {
    // 1. Müşteri kaydet
    const result = await db.prepare(`
      INSERT INTO customers (name, phone, email, notes)
      VALUES (?, ?, ?, ?)
    `).bind(
      body.name,
      body.phone,
      body.email || null,
      body.notes || null
    ).run()

    const customerId = result.meta?.last_row_id
    
    return c.json({
      success: true,
      customer_id: customerId
    })
  } catch (error) {
    console.error('Customer create error:', error)
    return c.json({ 
      success: false, 
      error: 'Database error',
      message: error.message 
    }, 500)
  }
})

// Müşteri detayı
router.get('/:id', async (c) => {
  const db = c.get('db')
  const { id } = c.req.param()
  
  try {
    const customer = await db.prepare(`
      SELECT * FROM customers
      WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first()
    
    if (!customer) {
      return c.json({ success: false, error: 'Customer not found' }, 404)
    }

    const { results: recipients } = await db.prepare(`
      SELECT * FROM recipients
      WHERE customer_id = ? AND deleted_at IS NULL
    `).bind(id).all()

    const { results: addresses } = await db.prepare(`
      SELECT * FROM addresses
      WHERE customer_id = ? AND deleted_at IS NULL
    `).bind(id).all()

    const { results: orders } = await db.prepare(`
      SELECT 
        o.*,
        r.name as recipient_name
      FROM orders o
      LEFT JOIN recipients r ON o.recipient_id = r.id
      WHERE o.customer_id = ? AND o.deleted_at IS NULL
      ORDER BY o.delivery_date DESC
      LIMIT 10
    `).bind(id).all()

    return c.json({
      success: true,
      customer,
      recipients: recipients || [],
      addresses: addresses || [],
      orders: orders || []
    })
  } catch (error) {
    console.error('Customer detail error:', error)
    return c.json({ 
      success: false, 
      error: 'Database error',
      message: error.message
    }, 500)
  }
})

// Müşteri güncelle
router.put('/:id', async (c) => {
  const db = c.get('db')
  const { id } = c.req.param()
  const body = await c.req.json()
  
  try {
    await db.prepare(`
      UPDATE customers 
      SET name = ?, phone = ?, email = ?, notes = ?
      WHERE id = ? AND deleted_at IS NULL
    `).bind(
      body.name,
      body.phone,
      body.email || null,
      body.notes || null,
      id
    ).run()
    
    return c.json({
      success: true
    })
  } catch (error) {
    console.error('Customer update error:', error)
    return c.json({ 
      success: false, 
      error: 'Database error',
      message: error.message 
    }, 500)
  }
})

// Müşteri siparişleri - View kullanımı
router.get('/:id/orders', async (c) => {
  const db = c.get('db')
  const { id } = c.req.param()
  
  try {
    const { results } = await db.prepare(`
      SELECT * FROM vw_customer_orders
      WHERE customer_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `).bind(
      parseInt(id)
    ).all()

    return c.json({
      success: true,
      orders: results || []
    })
  } catch (error) {
    console.error('Customer orders error:', error)
    return c.json({ 
      success: false,
      error: 'Database error',
      message: error.message 
    }, 500)
  }
})

// Müşteri adresleri
router.get('/:id/addresses', async (c) => {
  const db = c.get('db')
  const { id } = c.req.param()
  
  try {
    // SQL düzeltildi - addresses tablosu ile uyumlu hale getirildi
    const { results } = await db.prepare(`
      SELECT 
        a.*,
        COALESCE(a.label, 'Teslimat Adresi') as label,
        a.floor_no as floor,
        a.door_no as apartment_no
      FROM addresses a
      WHERE a.customer_id = ?
      AND a.deleted_at IS NULL
      ORDER BY a.created_at DESC
    `).bind(id).all()
    
    return c.json(results || [])
  } catch (error) {
    console.error('Customer addresses error:', error)
    return c.json({ 
      success: false, 
      error: 'Database error',
      details: error.message
    }, 500)
  }
})

// Müşteri sil (soft delete)
router.delete('/:id', async (c) => {
  const db = c.get('db')
  const { id } = c.req.param()
  
  try {
    await db.prepare(`
      UPDATE customers 
      SET deleted_at = datetime('now')
      WHERE id = ?
    `).bind(id).run()
    
    return c.json({
      success: true
    })
  } catch (error) {
    console.error('Customer delete error:', error)
    return c.json({ 
      success: false, 
      error: 'Database error',
      message: error.message 
    }, 500)
  }
})

// Alıcılar (recipients) endpointleri
router.post('/:customerId/recipients', async (c) => {
  const db = c.get('db')
  const { customerId } = c.req.param()
  const body = await c.req.json()
  
  try {
    const result = await db.prepare(`
      INSERT INTO recipients (
        customer_id, name, phone, alternative_phone, notes, special_dates, preferences
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      customerId,
      body.name,
      body.phone,
      body.alternative_phone || null,
      body.notes || null,
      body.special_dates || null,
      body.preferences || null
    ).run()
    
    return c.json({
      success: true,
      recipient_id: result.meta?.last_row_id
    })
  } catch (error) {
    console.error('Recipient create error:', error)
    return c.json({ 
      success: false, 
      error: 'Database error',
      message: error.message 
    }, 500)
  }
})

router.put('/recipients/:id', async (c) => {
  const db = c.get('db')
  const { id } = c.req.param()
  const body = await c.req.json()
  
  try {
    await db.prepare(`
      UPDATE recipients
      SET 
        name = ?, 
        phone = ?, 
        alternative_phone = ?, 
        notes = ?,
        special_dates = ?,
        preferences = ?
      WHERE id = ? AND deleted_at IS NULL
    `).bind(
      body.name,
      body.phone,
      body.alternative_phone || null,
      body.notes || null,
      body.special_dates || null,
      body.preferences || null,
      id
    ).run()
    
    return c.json({
      success: true
    })
  } catch (error) {
    console.error('Recipient update error:', error)
    return c.json({ 
      success: false, 
      error: 'Database error',
      message: error.message 
    }, 500)
  }
})

router.delete('/recipients/:id', async (c) => {
  const db = c.get('db')
  const { id } = c.req.param()
  
  try {
    await db.prepare(`
      UPDATE recipients
      SET deleted_at = datetime('now')
      WHERE id = ?
    `).bind(id).run()
    
    return c.json({
      success: true
    })
  } catch (error) {
    console.error('Recipient delete error:', error)
    return c.json({ 
      success: false, 
      error: 'Database error',
      message: error.message 
    }, 500)
  }
})

export default router
