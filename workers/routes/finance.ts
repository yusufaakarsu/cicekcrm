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
        COUNT(t.id) as transaction_count,
        SUM(CASE WHEN t.type = 'in' THEN t.amount ELSE -t.amount END) as total_movement
      FROM accounts a
      LEFT JOIN transactions t ON t.account_id = a.id
      WHERE a.tenant_id = ?
      AND a.is_active = 1
      GROUP BY a.id
      ORDER BY a.name ASC
    `).bind(tenant_id).all()

    return c.json(results)
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
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
    const { results } = await db.prepare(`
      SELECT 
        t.*,
        a.name as account_name,
        c.name as category_name,
        c.color as category_color
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN transaction_categories c ON t.category_id = c.id
      WHERE t.tenant_id = ?
      ORDER BY t.date DESC, t.id DESC
      LIMIT 100
    `).bind(tenant_id).all()

    return c.json(results)
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
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

// Finansal istatistikler
router.get('/stats', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')

  try {
    // Toplam bakiyeler
    const balances = await db.prepare(`
      SELECT 
        SUM(current_balance) as total_balance,
        COUNT(*) as total_accounts
      FROM accounts 
      WHERE tenant_id = ? AND is_active = 1
    `).bind(tenant_id).first()

    // Günlük işlemler
    const dailyStats = await db.prepare(`
      SELECT
        SUM(CASE WHEN type = 'in' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'out' THEN amount ELSE 0 END) as expense,
        COUNT(*) as transaction_count
      FROM transactions
      WHERE tenant_id = ?
      AND date(date) = date('now')
    `).bind(tenant_id).first()

    return c.json({
      balances,
      dailyStats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// Finansal istatistikler (Ana sayfa için)
router.get('/stats', async (c) => {
  const db = c.get('db')
  const tenant_id = c.get('tenant_id')

  try {
    // Hesap bakiyeleri
    const balances = await db.prepare(`
      SELECT 
        SUM(current_balance) as total_balance,
        COUNT(*) as total_accounts
      FROM accounts 
      WHERE tenant_id = ? AND is_active = 1
    `).bind(tenant_id).first()

    // Günlük işlem istatistikleri
    const dailyStats = await db.prepare(`
      SELECT
        SUM(CASE WHEN type = 'in' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'out' THEN amount ELSE 0 END) as expense,
        COUNT(*) as transaction_count
      FROM transactions
      WHERE tenant_id = ?
      AND DATE(date) = DATE('now')
    `).bind(tenant_id).first()

    // Bekleyen tahsilatlar
    const pendingPayments = await db.prepare(`
      SELECT SUM(amount) as total
      FROM invoices
      WHERE tenant_id = ? 
      AND type = 'receivable'
      AND status = 'pending'
    `).bind(tenant_id).first()

    return c.json({
      balances: balances || { total_balance: 0, total_accounts: 0 },
      dailyStats: dailyStats || { income: 0, expense: 0, transaction_count: 0 },
      pendingPayments: pendingPayments?.total || 0
    })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

export default router
