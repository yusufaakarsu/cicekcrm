
// Kasa bakiyelerini düzelt
router.post('/accounts/reconcile', async (c) => {
  const db = c.get('db');
  
  try {
    // Tüm işlemleri tiplere göre analiz et
    const { results: transactions } = await db.prepare(`
      SELECT 
        account_id,
        type,
        SUM(amount) as total_amount
      FROM transactions
      WHERE deleted_at IS NULL
      GROUP BY account_id, type
    `).all();
    
    // Her hesap için gelen/giden işlemleri yeniden hesapla
    const accountUpdates = [];
    const accounts = {};
    
    // İşlemleri grupla
    for (const tx of transactions) {
      if (!accounts[tx.account_id]) {
        accounts[tx.account_id] = { in: 0, out: 0 };
      }
      
      if (tx.type === 'in') {
        accounts[tx.account_id].in += parseFloat(tx.total_amount);
      } else if (tx.type === 'out') {
        accounts[tx.account_id].out += parseFloat(tx.total_amount);
      }
    }
    
    // Her hesap için bakiye doğrulama güncelleme sorgusu oluştur
    for (const [accountId, amounts] of Object.entries(accounts)) {
      const correctBalance = amounts.in - amounts.out;
      
      accountUpdates.push(db.prepare(`
        UPDATE accounts
        SET 
          balance_calculated = ?, 
          balance_verified = ?,
          last_verified_at = datetime('now')
        WHERE id = ?
      `).bind(correctBalance, correctBalance, accountId));
    }
    
    // Batch olarak tüm güncelleme sorgularını çalıştır
    if (accountUpdates.length > 0) {
      await db.batch(accountUpdates);
    }
    
    return c.json({
      success: true,
      message: 'Hesap bakiyeleri başarıyla güncellendi'
    });
    
  } catch (error) {
    console.error('Account reconciliation error:', error);
    return c.json({
      success: false,
      error: 'Bakiye güncelleme hatası',
      details: error.message
    }, 500);
  }
});
