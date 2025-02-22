import { Hono } from 'hono'

const router = new Hono()

// Ürün listesi
router.get('/', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    const { results } = await db.prepare(`
      SELECT 
        p.*,
        pc.name as category_name
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      WHERE p.tenant_id = ?
      AND p.deleted_at IS NULL
      ORDER BY p.name
    `).bind(tenant_id).all()
    
    return c.json(results)
  } catch (error) {
    return c.json({ 
      success: false,
      error: 'Database error',
      message: error.message 
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

// Kategori listesi
router.get('/categories', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    const { results } = await db.prepare(`
      SELECT * FROM product_categories 
      WHERE tenant_id = ? 
      AND deleted_at IS NULL 
      ORDER BY name
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

export default router