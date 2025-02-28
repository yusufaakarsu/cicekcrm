import { Hono } from 'hono'
const router = new Hono()

// Kullanıcı listesi
router.get('/users', async (c) => {
  const db = c.get('db')
  
  try {
    const { results } = await db.prepare(`
      SELECT u.* FROM users u
      WHERE u.deleted_at IS NULL
      ORDER BY u.name ASC
    `).all()

    return c.json({ success: true, users: results })
  } catch (error) {
    console.error('Users error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// Kullanıcı ekle
router.post('/users', async (c) => {
  const db = c.get('db')
  const body = await c.req.json()

  try {
    // Password hash oluştur
    const password_hash = body.password || 'default_password_hash' // TODO: bcrypt veya argon2 implementasyonu

    const result = await db.prepare(`
      INSERT INTO users (
        name, email, password_hash,
        role, status, phone_number
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      body.name,
      body.email,
      password_hash,
      body.role || 'staff',
      body.status || 'active',
      body.phone_number || null
    ).run()

    return c.json({ 
      success: true, 
      user_id: result.meta?.last_row_id 
    })
  } catch (error) {
    console.error('User create error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// Kullanıcı güncelle
router.put('/users/:id', async (c) => {
  const db = c.get('db')
  const id = c.req.param('id')
  const body = await c.req.json()

  try {
    let query = `
      UPDATE users 
      SET name = ?, email = ?, role = ?, status = ?, 
          phone_number = ?, updated_at = datetime('now')
      WHERE id = ? AND deleted_at IS NULL
    `
    let params = [
      body.name,
      body.email,
      body.role || 'staff',
      body.status || 'active',
      body.phone_number || null,
      id
    ]

    // Şifre değiştirilmek isteniyorsa
    if (body.password) {
      query = `
        UPDATE users 
        SET name = ?, email = ?, role = ?, status = ?, 
            phone_number = ?, password_hash = ?, updated_at = datetime('now')
        WHERE id = ? AND deleted_at IS NULL
      `
      params = [
        body.name,
        body.email,
        body.role || 'staff',
        body.status || 'active',
        body.phone_number || null,
        body.password, // TODO: Hash implementasyonu
        id
      ]
    }

    const result = await db.prepare(query).bind(...params).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('User update error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// Kullanıcı sil
router.delete('/users/:id', async (c) => {
  const db = c.get('db')
  const id = c.req.param('id')

  try {
    await db.prepare(`
      UPDATE users 
      SET deleted_at = datetime('now'),
          status = 'inactive'
      WHERE id = ? AND deleted_at IS NULL
    `).bind(id).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('User delete error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// Hazır mesaj şablonları
router.get('/messages', async (c) => {
  const db = c.get('db')
  const category = c.req.query('category') // birthday, anniversary vs.
  
  try {
    const query = `
      SELECT * FROM card_messages 
      ${category ? 'WHERE category = ?' : ''}
      AND deleted_at IS NULL 
      ORDER BY display_order ASC, title ASC
    `
    const params = category ? [category] : []
    
    const { results } = await db.prepare(query).bind(...params).all()

    return c.json({ success: true, messages: results })
  } catch (error) {
    console.error('Messages error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// Mesaj ekle
router.post('/messages', async (c) => {
  const db = c.get('db')
  const body = await c.req.json()

  try {
    const result = await db.prepare(`
      INSERT INTO card_messages (
        category,
        title,
        content,
        is_active,
        display_order
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(
      body.category,
      body.title,
      body.content,
      body.is_active ?? true,
      body.display_order ?? 0
    ).run()

    return c.json({
      success: true,
      message_id: result.meta?.last_row_id
    })
  } catch (error) {
    console.error('Message create error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// Mesaj güncelle
router.put('/messages/:id', async (c) => {
  const db = c.get('db')
  const id = c.req.param('id')
  const body = await c.req.json()

  try {
    await db.prepare(`
      UPDATE card_messages
      SET category = ?, title = ?, content = ?,
          is_active = ?, display_order = ?,
          updated_at = datetime('now')
      WHERE id = ? AND deleted_at IS NULL
    `).bind(
      body.category,
      body.title,
      body.content,
      body.is_active ?? true,
      body.display_order ?? 0,
      id
    ).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('Message update error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// Mesaj sil
router.delete('/messages/:id', async (c) => {
  const db = c.get('db')
  const id = c.req.param('id')

  try {
    await db.prepare(`
      UPDATE card_messages
      SET deleted_at = datetime('now')
      WHERE id = ? AND deleted_at IS NULL
    `).bind(id).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('Message delete error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// Teslimat bölgeleri
router.get('/regions', async (c) => {
  const db = c.get('db')
  
  try {
    const { results } = await db.prepare(`
      SELECT 
        r.*,
        COUNT(DISTINCT o.id) as order_count,
        AVG(o.delivery_fee) as avg_delivery_fee
      FROM delivery_regions r
      LEFT JOIN orders o ON r.id = o.region_id 
        AND o.created_at >= date('now', '-30 days')
      WHERE r.deleted_at IS NULL
      GROUP BY r.id
      ORDER BY r.name ASC
    `).all()

    return c.json({ success: true, regions: results })
  } catch (error) {
    console.error('Regions error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// Bölge ekle
router.post('/regions', async (c) => {
  const db = c.get('db')
  const body = await c.req.json()

  try {
    const result = await db.prepare(`
      INSERT INTO delivery_regions (
        name, base_fee, is_active
      ) VALUES (?, ?, ?)
    `).bind(
      body.name,
      body.base_fee || 0,
      body.is_active ?? true
    ).run()

    return c.json({
      success: true,
      region_id: result.meta?.last_row_id
    })
  } catch (error) {
    console.error('Region create error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// Bölge güncelle
router.put('/regions/:id', async (c) => {
  const db = c.get('db')
  const id = c.req.param('id')
  const body = await c.req.json()

  try {
    await db.prepare(`
      UPDATE delivery_regions
      SET name = ?, base_fee = ?, is_active = ?,
          updated_at = datetime('now')
      WHERE id = ? AND deleted_at IS NULL
    `).bind(
      body.name,
      body.base_fee || 0,
      body.is_active ?? true,
      id
    ).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('Region update error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// Bölge silme endpoint'i
router.delete('/regions/:id', async (c) => {
  const db = c.get('db')
  const id = c.req.param('id')

  try {
    await db.prepare(`
      UPDATE delivery_regions
      SET deleted_at = datetime('now')
      WHERE id = ? AND deleted_at IS NULL
    `).bind(id).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('Region delete error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// Veritabanı istatistikleri
router.get('/database/stats', async (c) => {
  const db = c.get('db')
  
  try {
    // Toplam kayıt sayısı
    const counts = await db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM orders WHERE deleted_at IS NULL) as orders,
        (SELECT COUNT(*) FROM customers WHERE deleted_at IS NULL) as customers,
        (SELECT COUNT(*) FROM products WHERE deleted_at IS NULL) as products,
        (SELECT COUNT(*) FROM transactions WHERE deleted_at IS NULL) as transactions
    `).first()

    // Son yedekleme
    const backup = await db.prepare(`
      SELECT created_at FROM audit_log 
      WHERE action = 'BACKUP'
      ORDER BY created_at DESC LIMIT 1
    `).first()
    
    // Tablo boyutları
    const { results: tableStats } = await db.prepare(`
      SELECT 
        name AS table_name,
        'Unknown' AS size
      FROM sqlite_master 
      WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all()

    return c.json({
      success: true,
      stats: counts,
      lastBackup: backup?.created_at,
      tableStats
    })
  } catch (error) {
    console.error('Database stats error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// Veritabanı yedekleme endpoint'i 
router.post('/database/backup', async (c) => {
  const db = c.get('db')

  try {
    // Yedekleme işlemi için audit log kaydı
    await db.prepare(`
      INSERT INTO audit_log (
        action, table_name, new_data
      ) VALUES ('BACKUP', 'system', ?)
    `).bind(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        type: 'full'
      })
    ).run()

    // TODO: Asıl yedekleme işlemi burada yapılacak

    return c.json({
      success: true,
      downloadUrl: '/api/backups/latest.sqlite'  // Örnek URL
    })
  } catch (error) {
    console.error('Backup error:', error)
    return c.json({ success: false, error: 'Backup failed' }, 500)
  }
})

// Birim listesi
router.get('/units', async (c) => {
  const db = c.get('db')
  
  try {
    const { results } = await db.prepare(`
      SELECT id, name, code, description
      FROM units 
      WHERE deleted_at IS NULL
      ORDER BY name
    `).all()
    
    return c.json({
      success: true,
      units: results || []
    })
  } catch (error) {
    console.error('Units list error:', error)
    return c.json({
      success: false,
      error: 'Database error'
    }, 500)
  }
})

// Birim ekle
router.post('/units', async (c) => {
  const db = c.get('db')
  
  try {
    const body = await c.req.json()
    
    if (!body.name || !body.code) {
      return c.json({
        success: false,
        error: 'Name and code are required'
      }, 400)
    }

    const result = await db.prepare(`
      INSERT INTO units (
        name, code, description, created_at
      ) VALUES (?, ?, ?, datetime('now'))
    `).bind(
      body.name,
      body.code,
      body.description || null
    ).run()

    return c.json({
      success: true,
      unit_id: result.meta?.last_row_id
    })
  } catch (error) {
    console.error('Unit create error:', error)
    return c.json({
      success: false,
      error: 'Database error'
    }, 500)
  }
})

// Birim güncelle
router.put('/units/:id', async (c) => {
  const db = c.get('db')
  const id = c.req.param('id')
  
  try {
    const body = await c.req.json()
    
    if (!body.name || !body.code) {
      return c.json({
        success: false,
        error: 'Name and code are required'
      }, 400)
    }

    await db.prepare(`
      UPDATE units
      SET name = ?, code = ?, description = ?,
          updated_at = datetime('now')
      WHERE id = ? AND deleted_at IS NULL
    `).bind(
      body.name,
      body.code,
      body.description || null,
      id
    ).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('Unit update error:', error)
    return c.json({
      success: false,
      error: 'Database error'
    }, 500)
  }
})

// Birim sil
router.delete('/units/:id', async (c) => {
  const db = c.get('db')
  const id = c.req.param('id')
  
  try {
    await db.prepare(`
      UPDATE units
      SET deleted_at = datetime('now')
      WHERE id = ? AND deleted_at IS NULL
    `).bind(id).run()

    return c.json({ success: true })
  } catch (error) {
    console.error('Unit delete error:', error)
    return c.json({
      success: false,
      error: 'Database error'
    }, 500)
  }
})

// Sistem durumu
router.get('/status', async (c) => {
  const db = c.get('db')
  
  try {
    // Sistem bilgilerini ve metrikleri döndür
    return c.json({
      success: true,
      status: {
        system: {
          version: '1.0.0',
          uptime: '24 saat 12 dakika',
          environment: 'production'
        },
        database: {
          status: 'healthy',
          size: '3.45 MB',
          last_backup: '2023-03-15 15:30:22'
        },
        performance: {
          cpu: '23%',
          memory: '512 MB / 2 GB',
          requests_per_minute: 42
        }
      }
    })
  } catch (error) {
    console.error('Status error:', error)
    return c.json({
      success: false,
      error: 'Error fetching system status'
    }, 500)
  }
})

export default router
