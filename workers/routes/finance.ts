import { Hono } from 'hono'

const router = new Hono()

// Hesapları listele
router.get('/accounts', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    const { results } = await db.prepare(`
      SELECT 
        a.*,
        COALESCE(
          (SELECT SUM(CASE WHEN type = 'in' THEN amount ELSE -amount END) 
           FROM transactions 
           WHERE account_id = a.id 
           AND status = 'completed'
           AND deleted_at IS NULL
          ), 0
        ) as total_movement
      FROM accounts a
      WHERE a.tenant_id = ?
      AND a.deleted_at IS NULL
      ORDER BY a.name ASC
    `).bind(tenant_id).all()

    return c.json({ success: true, accounts: results })
  } catch (error) {
    console.error('Accounts error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// Hesap detayı
router.get('/accounts/:id', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  const id = c.req.param('id')

  try {
    const account = await db.prepare(`
      SELECT * FROM accounts
      WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL
    `).bind(id, tenant_id).first()

    if (!account) {
      return c.json({ success: false, error: 'Account not found' }, 404)
    }

    return c.json({ success: true, account })
  } catch (error) {
    console.error('Account detail error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// Hesap hareketleri
router.get('/accounts/:id/movements', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
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
           AND status = 'completed'
           AND deleted_at IS NULL
          ), 0
        ) as balance_after
      FROM transactions t
      WHERE t.account_id = ?
      AND t.tenant_id = ?
      AND t.deleted_at IS NULL
      ORDER BY t.date DESC, t.id DESC
      LIMIT 100
    `).bind(id, id, tenant_id).all()

    return c.json({ success: true, movements: results })
  } catch (error) {
    console.error('Account movements error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// Hesap ekle
router.post('/accounts', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  const body = await c.req.json()

  try {
    const result = await db.prepare(`
      INSERT INTO accounts (
        tenant_id, name, type, currency, initial_balance, 
        current_balance, bank_name, bank_branch, bank_account_no,
        iban, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      tenant_id,
      body.name,
      body.type,
      body.currency || 'TRY',
      body.initial_balance || 0,
      body.initial_balance || 0,
      body.bank_name || null,
      body.bank_branch || null, 
      body.bank_account_no || null,
      body.iban || null,
      body.notes || null
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

// İşlemleri listele
router.get('/transactions', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')

  try {
    const result = await db.prepare(`
      SELECT 
        t.*,
        a.name as account_name,
        tc.name as category_name
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN transaction_categories tc ON t.category_id = tc.id
      WHERE t.tenant_id = ?
      AND t.deleted_at IS NULL
      ORDER BY t.date DESC, t.id DESC
      LIMIT 100
    `).bind(tenant_id).all()

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

// Filtrelenmiş işlemler listesi
router.get('/transactions/filtered', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
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
        c.color as category_color
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN transaction_categories c ON t.category_id = c.id
      WHERE t.tenant_id = ?
    `
    const params: any[] = [tenant_id]

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

// İşlem ekle
router.post('/transactions', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  const body = await c.req.json()

  try {
    const result = await db.prepare(`
      INSERT INTO transactions (
        tenant_id, account_id, category_id, type,
        amount, date, description, reference_type,
        reference_id, payment_method, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      tenant_id,
      body.account_id,
      body.category_id,
      body.type,
      body.amount,
      body.date || new Date().toISOString(),
      body.description,
      body.reference_type || null,
      body.reference_id || null,
      body.payment_method || null,
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

// Kategorileri listele
router.get('/categories', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')

  try {
    const { results } = await db.prepare(`
      SELECT * FROM transaction_categories
      WHERE tenant_id = ?
      ORDER BY type, name
    `).bind(tenant_id).all()

    return c.json(results)
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// İstatistikler
router.get('/stats', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')

  try {
    // Hesap bakiyeleri
    const balances = await db.prepare(`
      SELECT 
        SUM(balance_calculated) as total_balance,
        COUNT(*) as total_accounts
      FROM accounts 
      WHERE tenant_id = ? 
      AND deleted_at IS NULL
      AND status = 'active'
    `).bind(tenant_id).first()

    // Günlük işlemler
    const dailyStats = await db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'in' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'out' THEN amount ELSE 0 END), 0) as expense,
        COUNT(*) as transaction_count
      FROM transactions
      WHERE tenant_id = ?
      AND DATE(date) = DATE('now')
      AND status = 'completed'
      AND deleted_at IS NULL
    `).bind(tenant_id).first()

    // Aylık özet
    const monthlyStats = await db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'in' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'out' THEN amount ELSE 0 END), 0) as expense
      FROM transactions
      WHERE tenant_id = ?
      AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
      AND status = 'completed'
      AND deleted_at IS NULL
    `).bind(tenant_id).first()

    // Bekleyen tahsilatlar
    const pendingPayments = await db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE tenant_id = ?
      AND type = 'in'
      AND status = 'pending'
      AND deleted_at IS NULL
    `).bind(tenant_id).first()

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

// Gelir/Gider grafiği için veri
router.get('/reports/income-expense', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')

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
        AND t.tenant_id = ?
        AND t.status = 'completed'
        AND t.deleted_at IS NULL
      GROUP BY strftime('%Y-%m', dates.date)
      ORDER BY month ASC
    `).bind(tenant_id).all()

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

// Gelir özeti
router.get('/income/summary', async (c) => {
  // ... implementation ...
})

// Gider özeti
router.get('/expense/summary', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')

  try {
    // Bugünkü giderler
    const todayStats = await db.prepare(`
      SELECT
        COALESCE(SUM(amount), 0) as total,
        COUNT(*) as count
      FROM transactions
      WHERE tenant_id = ?
      AND type = 'out'
      AND DATE(date) = DATE('now')
      AND status = 'completed'
      AND deleted_at IS NULL
    `).bind(tenant_id).first()

    // Bekleyen ödemeler
    const upcomingStats = await db.prepare(`
      SELECT
        COALESCE(SUM(amount), 0) as total,
        COUNT(*) as count
      FROM transactions
      WHERE tenant_id = ?
      AND type = 'out'
      AND status = 'pending'
      AND deleted_at IS NULL
    `).bind(tenant_id).first()

    // Aylık toplam
    const monthlyStats = await db.prepare(`
      SELECT
        COALESCE(SUM(amount), 0) as total,
        COUNT(*) as count
      FROM transactions
      WHERE tenant_id = ?
      AND type = 'out'
      AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
      AND status = 'completed'
      AND deleted_at IS NULL
    `).bind(tenant_id).first()

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

// Gider listesi
router.get('/expenses', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  
  try {
    const { results } = await db.prepare(`
      SELECT 
        t.*,
        a.name as account_name,
        s.name as supplier_name,
        c.name as category_name,
        c.color as category_color
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN suppliers s ON t.supplier_id = s.id
      LEFT JOIN transaction_categories c ON t.category_id = c.id
      WHERE t.tenant_id = ?
      AND t.type = 'out'
      AND t.deleted_at IS NULL
      ORDER BY t.date DESC
      LIMIT 100
    `).bind(tenant_id).all()

    return c.json({
      success: true,
      expenses: results || []
    })
  } catch (error) {
    console.error('Expenses error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// Ödeme onaylama
router.post('/expenses/:id/approve', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  const id = c.req.param('id')

  try {
    const result = await db.prepare(`
      UPDATE transactions
      SET status = 'completed',
          completed_at = datetime('now'),
          updated_at = datetime('now')
      WHERE id = ?
      AND tenant_id = ?
      AND type = 'out'
      AND status = 'pending'
      AND deleted_at IS NULL
    `).bind(id, tenant_id).run()

    if (!result.success) {
      throw new Error('Expense approval failed')
    }

    return c.json({ success: true })
  } catch (error) {
    console.error('Expense approval error:', error)
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// Bekleyen ödemeler (Satın alma ve Siparişler)
router.get('/pending', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')

  try {
    // Bekleyen satın alma ödemeleri
    const purchases = await db.prepare(`
      SELECT 
        po.id,
        po.order_date as date,
        s.name as supplier_name,
        po.total_amount as amount,
        po.paid_amount,
        po.status,
        'purchase' as type
      FROM purchase_orders po
      JOIN suppliers s ON s.id = po.supplier_id
      WHERE po.tenant_id = ?
      AND po.payment_status = 'pending'
      AND po.deleted_at IS NULL
    `).bind(tenant_id).all();

    // Bekleyen sipariş tahsilatları
    const orders = await db.prepare(`
      SELECT 
        o.id,
        o.delivery_date as date,
        c.name as customer_name,
        o.total_amount as amount,
        o.paid_amount,
        o.status,
        'order' as type
      FROM orders o
      JOIN customers c ON c.id = o.customer_id
      WHERE o.tenant_id = ?
      AND o.payment_status = 'pending'
      AND o.deleted_at IS NULL
    `).bind(tenant_id).all();

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

// Ödeme detayları endpoint'i
router.get('/payments/:type/:id', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  const type = c.req.param('type')
  const id = c.req.param('id')

  try {
    let query = '';
    
    if (type === 'purchase') {
      query = `
        SELECT 
          po.*,
          s.name as supplier_name,
          s.phone as supplier_phone,
          s.contact_name as supplier_contact,
          total_amount as total_amount,
          paid_amount
        FROM purchase_orders po
        JOIN suppliers s ON s.id = po.supplier_id
        WHERE po.id = ? 
        AND po.tenant_id = ?
        AND po.deleted_at IS NULL
      `
    } else if (type === 'order') {
      query = `
        SELECT 
          o.*,
          c.name as customer_name,
          c.phone as customer_phone,
          total_amount as total_amount,
          paid_amount
        FROM orders o
        JOIN customers c ON c.id = o.customer_id
        WHERE o.id = ?
        AND o.tenant_id = ?
        AND o.deleted_at IS NULL
      `
    }

    const details = await db.prepare(query).bind(id, tenant_id).first()

    if (!details) {
      return c.json({ success: false, error: 'Record not found' }, 404)
    }

    // Hesapları getir
    const { results: accounts } = await db.prepare(`
      SELECT id, name, type 
      FROM accounts 
      WHERE tenant_id = ? 
      AND status = 'active'
      AND deleted_at IS NULL
    `).bind(tenant_id).all()

    return c.json({
      success: true,
      details: {
        ...details,
        total_amount: details.total_amount || 0,
        paid_amount: details.paid_amount || 0
      },
      accounts: accounts || []
    })

  } catch (error) {
    console.error('Payment details error:', error)
    return c.json({ 
      success: false, 
      error: 'Database error',
      details: error.message 
    }, 500)
  }
})

// Ödeme/Tahsilat kaydetme
router.post('/payments', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')
  const body = await c.req.json()

  try {
    console.log('Payment request:', body)

    // Eksik: Mevcut ödeme durumu kontrolü yapılmıyor
    // Eklenmeli:
    const currentPayment = await db.prepare(`
      SELECT total_amount, paid_amount 
      FROM ${body.related_type === 'purchase' ? 'purchase_orders' : 'orders'}
      WHERE id = ? AND tenant_id = ?
    `).bind(body.related_id, tenant_id).first()

    if (!currentPayment) {
      return c.json({ success: false, error: 'Record not found' }, 404)
    }

    if (currentPayment.paid_amount >= currentPayment.total_amount) {
      return c.json({ success: false, error: 'Payment already completed' }, 400)
    }

    // HATA 2: Ödeme tutarı kontrolü yok
    if (currentPayment.paid_amount + body.amount > currentPayment.total_amount) {
      return c.json({ 
        success: false, 
        error: 'Payment amount exceeds remaining balance',
        details: {
          total: currentPayment.total_amount,
          paid: currentPayment.paid_amount,
          remaining: currentPayment.total_amount - currentPayment.paid_amount
        }
      }, 400)
    }

    // 1. Kategori ID'sini belirle
    const categoryId = body.type === 'in' ? 
      // Sipariş tahsilatı için kategori 
      await db.prepare(`
        SELECT id FROM transaction_categories 
        WHERE tenant_id = ? AND reporting_code = 'SALES_CASH'
        LIMIT 1
      `).bind(tenant_id).first() :
      // Tedarikçi ödemesi için kategori
      await db.prepare(`
        SELECT id FROM transaction_categories 
        WHERE tenant_id = ? AND reporting_code = 'SUPPLIER'
        LIMIT 1
      `).bind(tenant_id).first()

    if (!categoryId?.id) {
      throw new Error('Transaction category not found')
    }

    // 2. Transaction kaydı
    const transaction = await db.prepare(`
      INSERT INTO transactions (
        tenant_id, type, amount, account_id,
        payment_method, date, description,  
        related_type, related_id, status,
        created_by, category_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      tenant_id,
      body.type,
      body.amount,
      body.account_id, 
      body.payment_method,
      body.date || new Date().toISOString(),
      body.notes || '',
      body.related_type,
      body.related_id,
      'completed',
      1,
      categoryId.id // Kategori ID'sini ekledik
    ).run()

    if (!transaction.success) {
      console.error('Transaction insert failed') // Debug için
      throw new Error('Transaction creation failed')
    }

    // 2. Related record update
    const table = body.related_type === 'purchase' ? 'purchase_orders' : 'orders'
    
    const update = await db.prepare(`
      UPDATE ${table}
      SET paid_amount = paid_amount + ?,
          payment_status = CASE 
            WHEN paid_amount + ? >= total_amount THEN 'completed'
            ELSE 'partial'
          END
      WHERE id = ? AND tenant_id = ?
    `).bind(
      body.amount,
      body.amount,
      body.related_id,
      tenant_id
    ).run()

    if (!update.success) {
      console.error('Payment update failed') // Debug için
      throw new Error('Payment update failed')
    }

    return c.json({ success: true })

  } catch (error) {
    console.error('Payment error:', error)
    return c.json({ 
      success: false, 
      error: 'Database error',
      details: error.message 
    }, 500)
  }
})

// Kategori listesi
router.get('/categories', async (c) => {
  // ... implementation ...
})

// ... other necessary endpoints ...

export default router
