import { Hono } from 'hono'

const router = new Hono()

// Hesapları listele - tenant_id kaldırıldı
router.get('/accounts', async (c) => {
  const db = c.get('db')
  
  try {
    const { results } = await db.prepare(`
      SELECT 
        a.*,
        COALESCE(
          (SELECT SUM(CASE WHEN type = 'in' THEN amount ELSE -amount END) 
           FROM transactions 
           WHERE account_id = a.id 
           AND status = 'paid'
           AND deleted_at IS NULL
          ), 0
        ) as total_movement
      FROM accounts a
      WHERE a.deleted_at IS NULL
      ORDER BY a.name ASC
    `).all()

    return c.json({ success: true, accounts: results })
  } catch (error) {
    console.error('Accounts error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// Hesap detayı - tenant_id kaldırıldı
router.get('/accounts/:id', async (c) => {
  const db = c.get('db')
  const id = c.req.param('id')

  try {
    const account = await db.prepare(`
      SELECT * FROM accounts
      WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first()

    if (!account) {
      return c.json({ success: false, error: 'Account not found' }, 404)
    }

    return c.json({ success: true, account })
  } catch (error) {
    console.error('Account detail error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// Hesap hareketleri - tenant_id kaldırıldı, status='paid' düzeltildi
router.get('/accounts/:id/movements', async (c) => {
  const db = c.get('db')
  const id = c.req.param('id')

  try {
    const { results } = await db.prepare(`
      SELECT 
        t.*,
        COALESCE(
          (SELECT SUM(CASE WHEN type = 'in' THEN amount ELSE -amount END)
           FROM transactions 
           WHERE account_id = ? 
           AND id <= t.id
           AND status = 'paid'
           AND deleted_at IS NULL
          ), 0
        ) as balance_after
      FROM transactions t
      WHERE t.account_id = ?
      AND t.deleted_at IS NULL
      ORDER BY t.date DESC, t.id DESC
      LIMIT 100
    `).bind(id, id).all()

    return c.json({ success: true, movements: results })
  } catch (error) {
    console.error('Account movements error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// Hesap ekle - tenant_id ve gereksiz alanlar kaldırıldı
router.post('/accounts', async (c) => {
  const db = c.get('db')
  const body = await c.req.json()

  try {
    const result = await db.prepare(`
      INSERT INTO accounts (
        name, type, initial_balance, balance_calculated,
        status
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(
      body.name,
      body.type,
      body.initial_balance || 0,
      body.initial_balance || 0,
      body.status || 'active'
    ).run()

    if (!result.success) {
      throw new Error('Account creation failed')
    }

    return c.json({
      success: true,
      account_id: result.meta?.last_row_id
    })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// İşlemleri listele - tenant_id kaldırıldı, status='paid' düzeltildi
router.get('/transactions', async (c) => {
  const db = c.get('db')

  try {
    const result = await db.prepare(`
      SELECT 
        t.*,
        a.name as account_name,
        tc.name as category_name
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN transaction_categories tc ON t.category_id = tc.id
      WHERE t.deleted_at IS NULL
      ORDER BY t.date DESC, t.id DESC
      LIMIT 100
    `).all()

    return c.json({
      success: true,
      transactions: result?.results || []
    })

  } catch (error) {
    console.error('Transactions error:', error);
    return c.json({ 
      success: false, 
      error: 'Database error',
      details: error.message 
    }, 500)
  }
})

// Filtrelenmiş işlemler listesi - tenant_id kaldırıldı
router.get('/transactions/filtered', async (c) => {
  const db = c.get('db')
  const { 
    account_id, 
    category_id, 
    type, 
    start_date, 
    end_date, 
    page = '1', 
    per_page = '10' 
  } = c.req.query()

  try {
    let query = `
      SELECT 
        t.*,
        a.name as account_name,
        c.name as category_name,
        COALESCE(c.reporting_code, 'OTHER') as category_code
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN transaction_categories c ON t.category_id = c.id
      WHERE t.deleted_at IS NULL
    `
    const params: any[] = []

    // Filtreler
    if (account_id) {
      query += ` AND t.account_id = ?`
      params.push(account_id)
    }

    if (category_id) {
      query += ` AND t.category_id = ?`
      params.push(category_id)
    }

    if (type) {
      query += ` AND t.type = ?`
      params.push(type)
    }

    if (start_date && end_date) {
      query += ` AND DATE(t.date) BETWEEN DATE(?) AND DATE(?)`
      params.push(start_date, end_date)
    }

    // Toplam kayıt sayısı
    const countQuery = query.replace('SELECT t.*,', 'SELECT COUNT(DISTINCT t.id) as total')
    const { total } = await db.prepare(countQuery).bind(...params).first() as any

    // Sıralama ve sayfalama
    query += ` ORDER BY t.date DESC, t.id DESC LIMIT ? OFFSET ?`
    const offset = (parseInt(page) - 1) * parseInt(per_page)
    params.push(per_page, offset)

    const { results } = await db.prepare(query).bind(...params).all()

    return c.json({
      success: true,
      transactions: results || [],
      pagination: {
        total,
        page: parseInt(page),
        per_page: parseInt(per_page),
        total_pages: Math.ceil(total / parseInt(per_page))
      }
    })

  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Database error',
      details: error.message 
    }, 500)
  }
})

// İşlem ekle - tenant_id kaldırıldı, related_type ve related_id olarak düzeltildi
router.post('/transactions', async (c) => {
  const db = c.get('db')
  const body = await c.req.json()

  try {
    const result = await db.prepare(`
      INSERT INTO transactions (
        account_id, category_id, type,
        amount, date, description, related_type,
        related_id, payment_method, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.account_id,
      body.category_id,
      body.type,
      body.amount,
      body.date || new Date().toISOString(),
      body.description,
      body.related_type || null,
      body.related_id || null,
      body.payment_method || 'cash',
      1 // TODO: Aktif kullanıcı ID'si
    ).run()

    if (!result.success) {
      throw new Error('Transaction creation failed')
    }

    return c.json({
      success: true,
      transaction_id: result.meta?.last_row_id
    })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// Kategorileri listele - tenant_id kaldırıldı
router.get('/categories', async (c) => {
  const db = c.get('db')

  try {
    const { results } = await db.prepare(`
      SELECT * FROM transaction_categories
      ORDER BY type, name
    `).all()

    return c.json({
      success: true,
      categories: results || []
    })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// İstatistikler - tenant_id kaldırıldı, status='paid' düzeltildi
router.get('/stats', async (c) => {
  const db = c.get('db')

  try {
    // Hesap bakiyeleri
    const balances = await db.prepare(`
      SELECT 
        SUM(balance_calculated) as total_balance,
        COUNT(*) as total_accounts
      FROM accounts 
      WHERE deleted_at IS NULL
      AND status = 'active'
    `).first()

    // Günlük işlemler
    const dailyStats = await db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'in' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'out' THEN amount ELSE 0 END), 0) as expense,
        COUNT(*) as transaction_count
      FROM transactions
      WHERE DATE(date) = DATE('now')
      AND status = 'paid'
      AND deleted_at IS NULL
    `).first()

    // Aylık özet
    const monthlyStats = await db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'in' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'out' THEN amount ELSE 0 END), 0) as expense
      FROM transactions
      WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
      AND status = 'paid'
      AND deleted_at IS NULL
    `).first()

    // Bekleyen tahsilatlar
    const pendingPayments = await db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE type = 'in'
      AND status = 'pending'
      AND deleted_at IS NULL
    `).first()

    return c.json({
      success: true,
      balances: balances || { total_balance: 0, total_accounts: 0 },
      dailyStats: dailyStats || { income: 0, expense: 0, transaction_count: 0 },
      monthlyStats: monthlyStats || { income: 0, expense: 0 },
      pendingPayments: pendingPayments?.total || 0
    })
  } catch (error) {
    console.error('Stats error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// Gelir/Gider grafiği için veri - tenant_id kaldırıldı, status='paid' düzeltildi
router.get('/reports/income-expense', async (c) => {
  const db = c.get('db')

  try {
    const { results } = await db.prepare(`
      WITH RECURSIVE dates(date) AS (
        SELECT date('now', '-11 months')
        UNION ALL
        SELECT date(date, '+1 month')
        FROM dates
        WHERE date < date('now')
      )
      SELECT 
        strftime('%Y-%m', dates.date) as month,
        COALESCE(SUM(CASE WHEN t.type = 'in' THEN t.amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN t.type = 'out' THEN t.amount ELSE 0 END), 0) as expense
      FROM dates
      LEFT JOIN transactions t ON strftime('%Y-%m', t.date) = strftime('%Y-%m', dates.date)
        AND t.status = 'paid'
        AND t.deleted_at IS NULL
      GROUP BY strftime('%Y-%m', dates.date)
      ORDER BY month ASC
    `).all()

    // Ayları ve verileri ayır
    const labels = results.map(r => r.month)
    const income = results.map(r => r.income)
    const expense = results.map(r => r.expense)

    return c.json({
      success: true,
      labels,
      income,
      expense
    })
  } catch (error) {
    console.error('Report error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// Gider özeti - tenant_id kaldırıldı, status='paid' düzeltildi
router.get('/expense/summary', async (c) => {
  const db = c.get('db')

  try {
    // Bugünkü giderler
    const todayStats = await db.prepare(`
      SELECT
        COALESCE(SUM(amount), 0) as total,
        COUNT(*) as count
      FROM transactions
      WHERE type = 'out'
      AND DATE(date) = DATE('now')
      AND status = 'paid'
      AND deleted_at IS NULL
    `).first()

    // Bekleyen ödemeler
    const upcomingStats = await db.prepare(`
      SELECT
        COALESCE(SUM(amount), 0) as total,
        COUNT(*) as count
      FROM transactions
      WHERE type = 'out'
      AND status = 'pending'
      AND deleted_at IS NULL
    `).first()

    // Aylık toplam
    const monthlyStats = await db.prepare(`
      SELECT
        COALESCE(SUM(amount), 0) as total,
        COUNT(*) as count
      FROM transactions
      WHERE type = 'out'
      AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
      AND status = 'paid'
      AND deleted_at IS NULL
    `).first()

    return c.json({
      success: true,
      today: {
        total: todayStats?.total || 0,
        count: todayStats?.count || 0
      },
      upcoming: {
        total: upcomingStats?.total || 0,
        count: upcomingStats?.count || 0
      },
      monthly: {
        total: monthlyStats?.total || 0,
        count: monthlyStats?.count || 0
      }
    })
  } catch (error) {
    console.error('Expense summary error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// Gider listesi - tenant_id kaldırıldı, supplier_name kaldırıldı
router.get('/expenses', async (c) => {
  const db = c.get('db')
  
  try {
    const { results } = await db.prepare(`
      SELECT 
        t.*,
        a.name as account_name,
        c.name as category_name,
        c.reporting_code as category_code
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN transaction_categories c ON t.category_id = c.id
      WHERE t.type = 'out'
      AND t.deleted_at IS NULL
      ORDER BY t.date DESC
      LIMIT 100
    `).all()

    return c.json({
      success: true,
      expenses: results || []
    })
  } catch (error) {
    console.error('Expenses error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// Ödeme onaylama - tenant_id kaldırıldı, status='paid' düzeltildi
router.post('/expenses/:id/approve', async (c) => {
  const db = c.get('db')
  const id = c.req.param('id')

  try {
    const result = await db.prepare(`
      UPDATE transactions
      SET status = 'paid'
      WHERE id = ?
      AND type = 'out'
      AND status = 'pending'
      AND deleted_at IS NULL
    `).bind(id).run()

    if (!result.success) {
      throw new Error('Expense approval failed')
    }

    return c.json({ success: true })
  } catch (error) {
    console.error('Expense approval error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// Bekleyen ödemeler (Satın alma ve Siparişler) - Düzeltildi
router.get('/pending', async (c) => {
  const db = c.get('db')

  try {
    // Bekleyen satın alma ödemeleri
    const purchases = await db.prepare(`
      SELECT 
        po.id,
        po.order_date as date,
        s.name as supplier_name,
        po.total_amount as amount,
        po.paid_amount,
        po.payment_status,
        'purchase' as type
      FROM purchase_orders po
      LEFT JOIN suppliers s ON s.id = po.supplier_id
      WHERE po.payment_status IN ('pending', 'partial')
      AND po.deleted_at IS NULL
    `).all();

    // Bekleyen sipariş tahsilatları
    const orders = await db.prepare(`
      SELECT 
        o.id,
        o.delivery_date as date,
        c.name as customer_name,
        o.total_amount as amount,
        o.paid_amount,
        o.payment_status,
        'order' as type
      FROM orders o
      LEFT JOIN customers c ON c.id = o.customer_id
      WHERE o.payment_status IN ('pending', 'partial')
      AND o.deleted_at IS NULL
    `).all();

    return c.json({
      success: true,
      pending: {
        purchases: purchases?.results || [],
        orders: orders?.results || []
      }
    });

  } catch (error) {
    console.error('Pending payments error:', error);
    return c.json({ success: false, error: 'Database error' }, 500);
  }
})

// Ödeme işlemleri endpoint'leri - tenant_id kaldırıldı
router.get('/payments/:type/:id', async (c) => {
  const db = c.get('db')
  const type = c.req.param('type')
  const id = c.req.param('id')

  try {
    // Kayıt detayları için SQL
    let query = type === 'purchase' ? 
      `SELECT po.*, s.name as supplier_name, s.phone as supplier_phone, s.contact_name as supplier_contact
       FROM purchase_orders po
       JOIN suppliers s ON s.id = po.supplier_id 
       WHERE po.id = ? AND po.deleted_at IS NULL` :
      `SELECT o.*, c.name as customer_name, c.phone as customer_phone
       FROM orders o
       JOIN customers c ON c.id = o.customer_id 
       WHERE o.id = ? AND o.deleted_at IS NULL`;

    // Ana kaydı ve hesapları getir
    const details = await db.prepare(query).bind(id).first()
    const { results: accounts } = await db.prepare(`
      SELECT id, name, type FROM accounts 
      WHERE status = 'active' AND deleted_at IS NULL
    `).all()

    if (!details) {
      return c.json({ success: false, error: 'Record not found' }, 404)
    }

    return c.json({
      success: true,
      details,
      accounts: accounts || []
    })
  } catch (error) {
    console.error('Payment details error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// Payment endpoint - tenant_id ve gereksiz alan kaldırıldı
router.post('/payments', async (c) => {
  const db = c.get('db')
  const body = await c.req.json()

  try {
    // 1. Validasyon
    if (!body.account_id || !body.amount || !body.related_type || !body.related_id) {
      return c.json({ success: false, error: 'Missing required fields' }, 400)
    }

    // 2. Category ID bul
    const category = await db.prepare(`
      SELECT id FROM transaction_categories 
      WHERE reporting_code = ?
      LIMIT 1
    `).bind(
      body.related_type === 'purchase' ? 'SUPPLIER' : 'SALES_CASH'
    ).first() as any

    // 3. Transaction ekle
    const result = await db.prepare(`
      INSERT INTO transactions (
        account_id, category_id,
        type, amount, date,
        payment_method, description, related_type, 
        related_id, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).bind(
      body.account_id,
      category.id,
      body.type,
      body.amount,
      body.date || new Date().toISOString(),
      body.payment_method || 'cash',
      body.description || '',
      body.related_type,
      body.related_id,
      1 // TODO: gerçek user_id gelecek
    ).run()

    // 4. İlgili kaydı güncelle
    const updateQuery = body.related_type === 'purchase' ? `
      UPDATE purchase_orders 
      SET paid_amount = paid_amount + ?,
          payment_status = CASE 
            WHEN paid_amount + ? >= total_amount THEN 'paid'
            WHEN paid_amount + ? > 0 THEN 'partial'
            ELSE payment_status 
          END
      WHERE id = ?
    ` : `
      UPDATE orders
      SET paid_amount = paid_amount + ?,
          payment_status = CASE 
            WHEN paid_amount + ? >= total_amount THEN 'paid'
            WHEN paid_amount + ? > 0 THEN 'partial'
            ELSE payment_status 
          END
      WHERE id = ?
    `

    await db.prepare(updateQuery).bind(
      body.amount, body.amount, body.amount,
      body.related_id
    ).run()

    return c.json({ 
      success: true, 
      transaction_id: result.meta?.last_row_id 
    })

  } catch (error) {
    console.error('Payment error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

export default router
