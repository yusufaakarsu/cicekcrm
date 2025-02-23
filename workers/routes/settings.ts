import { Hono } from 'hono'
const router = new Hono()

// Kullanıcı listesi
router.get('/users', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    const { results } = await db.prepare(`
      SELECT u.* FROM users u
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
    // Password hash oluştur
    const password_hash = 'temp_hash' // TODO: Gerçek hash implement edilecek

    const result = await db.prepare(`
      INSERT INTO users (
        tenant_id, name, email, password_hash,
        role, is_active
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      tenant_id,
      body.name,
      body.email,
      password_hash,
      body.role || 'staff',
      body.status === 'active' ? 1 : 0
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

// Hazır mesaj şablonları
router.get('/messages', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  const category = c.req.query('category') // birthday, anniversary vs.
  
  try {
    const query = `
      SELECT * FROM card_messages 
      WHERE tenant_id = ? 
      ${category ? 'AND category = ?' : ''}
      AND deleted_at IS NULL 
      ORDER BY display_order ASC, title ASC
    `
    const params = category ? [tenant_id, category] : [tenant_id]
    
    const { results } = await db.prepare(query).bind(...params).all()

    return c.json({ success: true, messages: results })
  } catch (error) {
    console.error('Messages error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// Mesaj ekle/güncelle 
router.post('/messages', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  const body = await c.req.json()

  try {
    const result = await db.prepare(`
      INSERT INTO card_messages (
        tenant_id, 
        category,
        title,
        content,
        is_active,
        display_order
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      tenant_id,
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
        0 as delivery_count
      FROM delivery_regions r
      WHERE r.tenant_id = ?
      AND r.deleted_at IS NULL
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
        tenant_id, name, base_fee, min_order,
        parent_id, delivery_notes, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      tenant_id,
      body.name,
      body.delivery_fee || 0,
      body.min_order || 0,
      null, // parent_id
      body.notes || null,
      body.status === 'active' ? 1 : 0
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

// Tablo listesi endpoint'ini basitleştir
router.get('/database/tables', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    // Önce tablo listesini al
    const tables = await db.prepare(`
      SELECT name as table_name
      FROM sqlite_master 
      WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all()

    // Kolon ve kayıt sayılarını ayrı sorgularla al
    const enrichedTables = []
    
    for (const table of tables.results) {
      try {
        // Kolon sayısı
        const columns = await db.prepare(`
          SELECT COUNT(*) as count 
          FROM pragma_table_info(?)
        `).bind(table.table_name).first()

        // Kayıt sayısı (tenant_id varsa)
        let recordCount = 0
        try {
          const hasTenantId = await db.prepare(`
            SELECT 1 FROM pragma_table_info(?) 
            WHERE name = 'tenant_id'
          `).bind(table.table_name).first()

          if (hasTenantId) {
            const count = await db.prepare(`
              SELECT COUNT(*) as count 
              FROM "${table.table_name}" 
              WHERE tenant_id = ?
            `).bind(tenant_id).first()
            recordCount = count?.count || 0
          }
        } catch (e) {
          console.warn(`Record count error for ${table.table_name}:`, e)
        }

        enrichedTables.push({
          table_name: table.table_name,
          column_count: columns?.count || 0,
          record_count: recordCount
        })
      } catch (e) {
        console.warn(`Table info error for ${table.table_name}:`, e)
        enrichedTables.push({
          table_name: table.table_name,
          column_count: 0,
          record_count: 0
        })
      }
    }
  
    return c.json({ 
      success: true, 
      tables: enrichedTables
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

  try {
    // Güvenlik kontrolü
    if (query.toLowerCase().includes('drop') || 
        query.toLowerCase().includes('delete')) {
      return c.json({ 
        success: false, 
        error: 'Bu işlem yasaklanmıştır' 
      }, 403)
    }

    // Sorguyu direkt çalıştır
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
