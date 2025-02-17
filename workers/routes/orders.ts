import { Hono } from 'hono'

const router = new Hono()

// Tüm siparişleri listele
router.get('/', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    const { results } = await db.prepare(`
      SELECT o.*, 
             c.name as customer_name,
             c.phone as customer_phone,
             GROUP_CONCAT(oi.quantity || 'x ' || p.name) as items_list,
             o.delivery_time_slot,
             DATE(o.delivery_date) as delivery_date
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.tenant_id = ?
      GROUP BY o.id
      ORDER BY o.delivery_date DESC
    `).bind(tenant_id).all()
    
    return c.json(results)
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// Bugünün siparişleri
router.get('/today', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  try {
    const { results } = await db.prepare(`
      SELECT o.*, c.name as customer_name 
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE DATE(o.delivery_date) = DATE('now')
      AND o.tenant_id = ?
      ORDER BY o.delivery_date ASC
    `).bind(tenant_id).all()
    return c.json(results)
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// Sipariş detayları
router.get('/:id/details', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  const { id } = c.req.param()
  
  try {
    const order = await db.prepare(`
      SELECT 
        o.*,
        c.name as customer_name,
        c.phone as customer_phone,
        a.label as delivery_address,
        a.city as delivery_city,
        a.district as delivery_district,
        a.street as delivery_street,
        a.building_no,
        a.postal_code,
        GROUP_CONCAT(oi.quantity || 'x ' || p.name) as items,
        CASE 
          WHEN o.payment_method = 'credit_card' THEN 'Kredi Kartı'
          WHEN o.payment_method = 'bank_transfer' THEN 'Havale/EFT'
          WHEN o.payment_method = 'cash' THEN 'Nakit'
          ELSE o.payment_method 
        END as payment_method_text
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN addresses a ON o.delivery_address_id = a.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.id = ?
      AND o.tenant_id = ?
      GROUP BY o.id
    `).bind(id, tenant_id).first()

    if (!order) {
      return c.json({ error: 'Order not found' }, 404)
    }

    return c.json(order)
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// Filtrelenmiş siparişler 
router.get('/filtered', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  const { status, date_filter, start_date, end_date, sort = 'id_desc', page = '1', per_page = '10' } = c.req.query()
  
  try {
    let baseQuery = `
      SELECT 
        o.*,
        c.name as customer_name,
        c.phone as customer_phone,
        GROUP_CONCAT(oi.quantity || 'x ' || p.name) as items
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.tenant_id = ?
      AND o.is_deleted = 0
    `
    
    const params: any[] = [tenant_id]

    // Status filtresi
    if (status) {
      baseQuery += ` AND o.status = ?`
      params.push(status)
    }

    // Tarih filtresi
    if (date_filter) {
      switch (date_filter) {
        case 'today':
          baseQuery += ` AND DATE(o.delivery_date) = DATE('now')`
          break
        case 'tomorrow':
          baseQuery += ` AND DATE(o.delivery_date) = DATE('now', '+1 day')`
          break
        case 'week':
          baseQuery += ` AND DATE(o.delivery_date) BETWEEN DATE('now') AND DATE('now', '+7 days')`
          break
        case 'month':
          baseQuery += ` AND strftime('%Y-%m', o.delivery_date) = strftime('%Y-%m', 'now')`
          break
      }
    } else if (start_date && end_date) {
      baseQuery += ` 
        AND DATETIME(o.delivery_date) >= DATETIME(?)
        AND DATETIME(o.delivery_date) <= DATETIME(?)
      `
      params.push(start_date, end_date)
    }

    // Grup ve sıralama
    baseQuery += ` GROUP BY o.id`

    // Sıralama
    switch(sort) {
      case 'id_asc':
        baseQuery += ` ORDER BY o.id ASC`
        break
      case 'id_desc':
        baseQuery += ` ORDER BY o.id DESC`
        break
      case 'date_asc':
        baseQuery += ` ORDER BY o.delivery_date ASC, o.id ASC`
        break
      case 'date_desc':
        baseQuery += ` ORDER BY o.delivery_date DESC, o.id DESC`
        break
      case 'amount_asc':
        baseQuery += ` ORDER BY o.total_amount ASC, o.id DESC`
        break
      case 'amount_desc':
        baseQuery += ` ORDER BY o.total_amount DESC, o.id DESC`
        break
      default:
        baseQuery += ` ORDER BY o.id DESC`
    }

    // Sayfalama
    baseQuery += ` LIMIT ? OFFSET ?`
    const pageNum = parseInt(page)
    const perPage = parseInt(per_page)
    const offset = (pageNum - 1) * perPage
    params.push(perPage, offset)

    const { results: orders } = await db.prepare(baseQuery).bind(...params).all()
    const total = await getOrdersCount(db, tenant_id, status, date_filter, start_date, end_date)

    return c.json({
      orders: orders || [],
      total,
      page: pageNum,
      per_page: perPage,
      total_pages: Math.ceil(total / perPage)
    })

  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// Sipariş durumunu güncelle
router.put('/:id/status', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  const { id } = c.req.param()
  const { status } = await c.req.json()
  
  try {
    await db.prepare(`
      UPDATE orders 
      SET status = ?,
          updated_at = DATETIME('now')
      WHERE id = ?
      AND tenant_id = ?
    `).bind(status, id, tenant_id).run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// Sipariş iptal et
router.put('/:id/cancel', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  const { id } = c.req.param()
  
  try {
    await db.prepare(`
      UPDATE orders 
      SET status = 'cancelled',
          updated_at = DATETIME('now')
      WHERE id = ?
      AND tenant_id = ?
    `).bind(id, tenant_id).run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// Helper function: Sipariş sayısını getir
async function getOrdersCount(db: D1Database, tenant_id: number, status?: string, date_filter?: string, start_date?: string, end_date?: string) {
  let countQuery = `
    SELECT COUNT(DISTINCT o.id) as total 
    FROM orders o 
    WHERE o.tenant_id = ?
    AND o.is_deleted = 0
  `
  
  const params: any[] = [tenant_id]

  if (status) {
    countQuery += ` AND o.status = ?`
    params.push(status)
  }

  if (date_filter) {
    switch (date_filter) {
      case 'today':
        countQuery += ` AND date(o.delivery_date) = date('now')`
        break
      case 'tomorrow':
        countQuery += ` AND date(o.delivery_date) = date('now', '+1 day')`
        break
      case 'week':
        countQuery += ` AND date(o.delivery_date) BETWEEN date('now') AND date('now', '+7 days')`
        break
      case 'month':
        countQuery += ` AND strftime('%Y-%m', o.delivery_date) = strftime('%Y-%m', 'now')`
        break
    }
  } else if (start_date && end_date) {
    countQuery += ` AND date(o.delivery_date) BETWEEN date(?) AND date(?)`
    params.push(start_date, end_date)
  }

  const result = await db.prepare(countQuery).bind(...params).first()
  return (result as any).total
}

export default router
