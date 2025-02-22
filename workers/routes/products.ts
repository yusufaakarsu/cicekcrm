import { Hono } from 'hono'

const router = new Hono()

// Ürün listesi - view kullanımı
router.get('/', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  const { searchParams } = new URL(c.req.url)
  const category_id = searchParams.get('category_id')
  const status = searchParams.get('status')
  const search = searchParams.get('search')
  
  try {
    let sql = `SELECT * FROM vw_products WHERE tenant_id = ?`
    const params: any[] = [tenant_id]

    if (category_id) {
      sql += ' AND category_id = ?'
      params.push(category_id)
    }

    if (status) {
      sql += ' AND status = ?'
      params.push(status)
    }

    if (search) {
      sql += ' AND (name LIKE ? OR description LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    sql += ' ORDER BY name'

    const { results } = await db.prepare(sql).bind(...params).all()
    
    return c.json({
      success: true,
      products: results
    })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// Ürün detayı
router.get('/:id', async (c) => {
  const { id } = c.req.param()
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    const product = await db.prepare(`
      SELECT p.*, pc.name as category_name
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      WHERE p.id = ? AND p.tenant_id = ? AND p.deleted_at IS NULL
    `).bind(id, tenant_id).first()
    
    if (!product) {
      return c.json({ success: false, error: 'Product not found' }, 404)
    }

    return c.json({ success: true, product })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Database error' 
    }, 500)
  }
})

// Yeni ürün ekle
router.post('/', async (c) => {
  const body = await c.req.json()
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    const result = await db.prepare(`
      INSERT INTO products (
        tenant_id, category_id, name, description,
        base_price, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      tenant_id,
      body.category_id,
      body.name,
      body.description,
      body.base_price,
      body.status || 'active'
    ).run()

    return c.json({
      success: true,
      id: result.meta?.last_row_id
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Database error' 
    }, 500)
  }
})

// Ürün güncelle
router.put('/:id', async (c) => {
  const { id } = c.req.param()
  const body = await c.req.json()
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    await db.prepare(`
      UPDATE products 
      SET 
        category_id = ?,
        name = ?,
        description = ?,
        base_price = ?,
        status = ?,
        updated_at = datetime('now')
      WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL
    `).bind(
      body.category_id,
      body.name,
      body.description,
      body.base_price,
      body.status,
      id,
      tenant_id
    ).run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Database error' 
    }, 500)
  }
})

// Ürün sil (soft delete)
router.delete('/:id', async (c) => {
  const { id } = c.req.param()
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    await db.prepare(`
      UPDATE products 
      SET deleted_at = datetime('now')
      WHERE id = ? AND tenant_id = ?
    `).bind(id, tenant_id).run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Database error' 
    }, 500)
  }
})

// Düşük stoklu ürünler
router.get('/low-stock', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    const { results } = await db.prepare(`
      SELECT 
        p.*,
        COALESCE(SUM(oi.quantity), 0) as reserved_quantity,
        (p.stock - COALESCE(SUM(oi.quantity), 0)) as available_stock,
        CASE 
          WHEN p.stock <= p.min_stock THEN 'critical'
          WHEN p.stock <= p.min_stock * 1.5 THEN 'warning'
          ELSE 'ok'
        END as stock_status
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status IN ('new', 'preparing')
      WHERE p.tenant_id = ?
      AND p.is_deleted = 0
      GROUP BY p.id
      HAVING available_stock <= p.min_stock * 1.5
      ORDER BY available_stock ASC
    `).bind(tenant_id).all()
    
    return c.json(results)
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// Kategori endpoint'lerini products.ts'ye ekleyelim
router.get('/product-categories', async (c) => {
  const db = c.get('db')
  
  try {
    const { results } = await db.prepare(`
      SELECT id, tenant_id, name, description 
      FROM product_categories 
      WHERE is_deleted = 0 
      ORDER BY name
    `).all()
    
    return c.json({
      success: true,
      categories: results
    })
  } catch (error) {
    console.error('Kategori listeleme hatası:', error)
    return c.json({
      success: false,
      error: 'Kategoriler alınamadı'
    }, 500)
  }
})

// Kategori listesi - view kullanımı
router.get('/categories', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    const { results } = await db.prepare(`
      SELECT 
        pc.*,
        COUNT(p.id) as product_count
      FROM product_categories pc
      LEFT JOIN products p ON pc.id = p.category_id 
      AND p.deleted_at IS NULL
      WHERE pc.tenant_id = ? 
      AND pc.deleted_at IS NULL
      GROUP BY pc.id
      ORDER BY pc.name
    `).bind(tenant_id).all()
    
    return c.json({
      success: true,
      categories: results
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Database error' 
    }, 500)
  }
})

// Yeni kategori ekle
router.post('/categories', async (c) => {
  const body = await c.req.json()
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    const result = await db.prepare(`
      INSERT INTO product_categories (tenant_id, name, description)
      VALUES (?, ?, ?)
    `).bind(tenant_id, body.name, body.description).run()

    return c.json({
      success: true,
      id: result.meta?.last_row_id
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Database error' 
    }, 500)
  }
})

// Kategori sil
router.delete('/categories/:id', async (c) => {
  const { id } = c.req.param()
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    await db.prepare(`
      UPDATE product_categories 
      SET deleted_at = datetime('now')
      WHERE id = ? AND tenant_id = ?
    `).bind(id, tenant_id).run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Database error' 
    }, 500)
  }
})

// Raw materials listesi
router.get('/raw-materials', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    // Raw materials view'ını kullanalım
    const { results } = await db.prepare(`
      SELECT 
        rm.*,
        u.name as unit_name,
        u.code as unit_code,
        COALESCE(
          (SELECT SUM(CASE WHEN sm.movement_type = 'in' THEN sm.quantity ELSE -sm.quantity END)
           FROM stock_movements sm 
           WHERE sm.material_id = rm.id AND sm.deleted_at IS NULL
          ), 0
        ) as current_stock
      FROM raw_materials rm
      LEFT JOIN units u ON rm.unit_id = u.id
      WHERE rm.tenant_id = ? AND rm.deleted_at IS NULL
      ORDER BY rm.name
    `).bind(tenant_id).all()
    
    return c.json({
      success: true,
      materials: results
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Database error' 
    }, 500)
  }
})

export default router