import { Hono } from 'hono'

const router = new Hono()

// Satın alma listesi
router.get('/orders', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    const { results } = await db.prepare(`
      SELECT 
        po.*,
        s.name as supplier_name,
        u.name as created_by_name
      FROM purchase_orders po
      JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN users u ON po.created_by = u.id
      WHERE po.tenant_id = ? 
      AND po.deleted_at IS NULL
      ORDER BY po.created_at DESC
    `).bind(tenant_id).all()
    
    return c.json({
      success: true,
      orders: results
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Database error' 
    }, 500)
  }
})

// ...devamı gelecek...

export default router
