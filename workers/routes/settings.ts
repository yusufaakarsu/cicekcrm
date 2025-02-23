import { Hono } from 'hono'
const router = new Hono()

// Kullanıcı listesi
router.get('/users', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    const { results } = await db.prepare(`
      SELECT 
        u.*,
        (SELECT COUNT(*) FROM user_logins WHERE user_id = u.id) as login_count,
        (SELECT MAX(created_at) FROM user_logins WHERE user_id = u.id) as last_login
      FROM users u
      WHERE u.tenant_id = ?
      AND u.deleted_at IS NULL
      ORDER BY u.name ASC
    `).bind(tenant_id).all()

    return c.json({ success: true, users: results })
  } catch (error) {
    console.error('Users error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// Kullanıcı ekle/güncelle
router.post('/users', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  const body = await c.req.json()

  try {
    const result = await db.prepare(`
      INSERT INTO users (tenant_id, name, email, role, permissions, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      tenant_id,
      body.name,
      body.email,
      body.role,
      JSON.stringify(body.permissions || []),
      body.status || 'active'
    ).run()

    return c.json({ 
      success: true, 
      user_id: result.meta?.last_row_id 
    })
  } catch (error) {
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// Hazır mesaj şablonları
router.get('/message-templates', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    const { results } = await db.prepare(`
      SELECT * FROM message_templates
      WHERE tenant_id = ?
      AND deleted_at IS NULL
      ORDER BY type, name ASC
    `).bind(tenant_id).all()

    return c.json({ success: true, templates: results })
  } catch (error) {
    console.error('Templates error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// Mesaj şablonu ekle/güncelle
router.post('/message-templates', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  const body = await c.req.json()

  try {
    const result = await db.prepare(`
      INSERT INTO message_templates (
        tenant_id, name, type, content, variables
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(
      tenant_id,
      body.name,
      body.type,
      body.content,
      JSON.stringify(body.variables || [])
    ).run()

    return c.json({
      success: true,
      template_id: result.meta?.last_row_id
    })
  } catch (error) {
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// Teslimat bölgeleri
router.get('/delivery-regions', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    const { results } = await db.prepare(`
      SELECT 
        r.*,
        COUNT(DISTINCT d.id) as delivery_count
      FROM delivery_regions r
      LEFT JOIN deliveries d ON r.id = d.region_id 
        AND d.created_at >= date('now', '-30 days')
      WHERE r.tenant_id = ?
      AND r.deleted_at IS NULL
      GROUP BY r.id
      ORDER BY r.name ASC
    `).bind(tenant_id).all()

    return c.json({ success: true, regions: results })
  } catch (error) {
    console.error('Regions error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// Bölge ekle/güncelle
router.post('/delivery-regions', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  const body = await c.req.json()

  try {
    const result = await db.prepare(`
      INSERT INTO delivery_regions (
        tenant_id, name, delivery_fee, min_time, max_time,
        coordinates, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      tenant_id,
      body.name,
      body.delivery_fee,
      body.min_time,
      body.max_time,
      JSON.stringify(body.coordinates || []),
      body.notes,
      body.status || 'active'
    ).run()

    return c.json({
      success: true,
      region_id: result.meta?.last_row_id
    })
  } catch (error) {
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// Veritabanı istatistikleri
router.get('/database/stats', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    // Toplam kayıt sayısı
    const counts = await db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM orders WHERE tenant_id = ?) as order_count,
        (SELECT COUNT(*) FROM customers WHERE tenant_id = ?) as customer_count,
        (SELECT COUNT(*) FROM products WHERE tenant_id = ?) as product_count,
        (SELECT COUNT(*) FROM transactions WHERE tenant_id = ?) as transaction_count
    `).bind(tenant_id, tenant_id, tenant_id, tenant_id).first()

    // Son yedekleme
    const backup = await db.prepare(`
      SELECT created_at FROM audit_log 
      WHERE tenant_id = ? 
      AND action = 'BACKUP'
      ORDER BY created_at DESC LIMIT 1
    `).bind(tenant_id).first()

    return c.json({
      success: true,
      stats: {
        total_records: Object.values(counts).reduce((a: number, b: number) => a + b, 0),
        last_backup: backup?.created_at,
        total_tables: 15, // Sabit değer
        table_counts: counts
      }
    })
  } catch (error) {
    console.error('Database stats error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// Teslimat bölgeleri
router.get('/regions', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    const { results } = await db.prepare(`
      SELECT 
        r.*,
        COUNT(DISTINCT o.id) as order_count,
        AVG(o.delivery_fee) as avg_delivery_fee
      FROM delivery_regions r
      LEFT JOIN orders o ON r.id = o.region_id 
        AND o.created_at >= date('now', '-30 days')
      WHERE r.tenant_id = ?
      AND r.deleted_at IS NULL
      GROUP BY r.id
      ORDER BY r.name ASC
    `).bind(tenant_id).all()

    return c.json({ success: true, regions: results })
  } catch (error) {
    console.error('Regions error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// Tablo listesi endpoint'i
router.get('/database/tables', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    // SQLite master tablosundan tablo listesini al
    const { results } = await db.prepare(`
      SELECT 
        m.name as table_name,
        (SELECT COUNT(*) FROM ${"`"}${m.name}${"`"} WHERE tenant_id = ?) as record_count,
        MAX(t.updated_at) as last_updated
      FROM sqlite_master m
      LEFT JOIN ${"`"}${m.name}${"`"} t ON t.tenant_id = ?
      WHERE m.type = 'table'
      AND m.name NOT LIKE 'sqlite_%'
      GROUP BY m.name
      ORDER BY m.name
    `).bind(tenant_id, tenant_id).all()

    return c.json({ 
      success: true, 
      tables: results || []
    })
  } catch (error) {
    console.error('Tables error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// SQL sorgu çalıştırma endpoint'i
router.post('/database/query', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  const { query } = await c.req.json()

  // Güvenlik kontrolü
  if (query.toLowerCase().includes('drop') || 
      query.toLowerCase().includes('delete')) {
    return c.json({ 
      success: false, 
      error: 'Bu işlem yasaklanmıştır' 
    }, 403)
  }

  try {
    // Sorguyu çalıştır
    const { results } = await db.prepare(query)
      .bind(tenant_id)
      .all()

    return c.json({
      success: true,
      results: results || []
    })
  } catch (error) {
    console.error('Query error:', error)
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500)
  }
})

// Veritabanı yedekleme endpoint'i 
router.post('/database/backup', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')

  try {
    // Yedekleme işlemi için audit log kaydı
    await db.prepare(`
      INSERT INTO audit_log (
        tenant_id, action, table_name, new_data
      ) VALUES (?, 'BACKUP', 'system', ?)
    `).bind(
      tenant_id,
      JSON.stringify({
        timestamp: new Date().toISOString(),
        type: 'full'
      })
    ).run()

    // TODO: Asıl yedekleme işlemi burada yapılacak

    return c.json({
      success: true,
      backup_url: '/api/backups/latest.sqlite'  // Örnek URL
    })
  } catch (error) {
    console.error('Backup error:', error)
    return c.json({ success: false, error: 'Backup failed' }, 500)
  }
})

// Teslimat bölgesi detayı
router.get('/regions/:id', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  const id = c.req.param('id')

  try {
    const region = await db.prepare(`
      SELECT * FROM delivery_regions
      WHERE id = ? AND tenant_id = ?
      AND deleted_at IS NULL
    `).bind(id, tenant_id).first()

    if (!region) {
      return c.json({ success: false, error: 'Region not found' }, 404)
    }

    return c.json({ success: true, region })
  } catch (error) {
    console.error('Region detail error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// Bölge silme endpoint'i
router.delete('/regions/:id', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  const id = c.req.param('id')

  try {
    const result = await db.prepare(`
      UPDATE delivery_regions
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ?
    `).bind(id, tenant_id).run()

    if (!result.success) {
      throw new Error('Region delete failed')
    }

    return c.json({ success: true })
  } catch (error) {
    console.error('Region delete error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

export default router
