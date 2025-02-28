import { Hono } from 'hono'

const router = new Hono()

// Ham madde listesi - EN BAŞA ALINMALI
router.get('/raw-materials', async (c) => {
  const db = c.get('db')
  
  try {
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
      WHERE rm.deleted_at IS NULL
      ORDER BY rm.name
    `).all()
    
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

// Kategori listesi endpoint'ini güncelle - URL'i düzelt
router.get('/categories', async (c) => {
  const db = c.get('db')
  
  try {
    const { results } = await db.prepare(`
      SELECT 
        pc.*,
        COUNT(p.id) as product_count
      FROM product_categories pc
      LEFT JOIN products p ON pc.id = p.category_id 
      AND p.deleted_at IS NULL
      WHERE pc.deleted_at IS NULL
      GROUP BY pc.id
      ORDER BY pc.name
    `).all()
    
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

// Kategori detayı
router.get('/categories/:id', async (c) => {
  const { id } = c.req.param()
  const db = c.get('db')
  
  try {
    const category = await db.prepare(`
      SELECT * FROM product_categories 
      WHERE id = ?
      AND deleted_at IS NULL
    `).bind(id).first()
    
    if (!category) {
      return c.json({ success: false, error: 'Category not found' }, 404)  
    }

    return c.json({ success: true, category })
  } catch (error) {
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// Kategori güncelleme - updated_at kaldırıldı
router.put('/categories/:id', async (c) => {
  const { id } = c.req.param()
  const body = await c.req.json()
  const db = c.get('db')
  
  try {
    await db.prepare(`
      UPDATE product_categories SET
        name = ?,
        description = ?,
        status = ?
      WHERE id = ? AND deleted_at IS NULL
    `).bind(
      body.name,
      body.description,
      body.status || 'active',
      id
    ).run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ success: false, error: 'Database error' }, 500)
  }
})

// Düşük stoklu ürünler
router.get('/low-stock', async (c) => {
  const db = c.get('db')
  
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
      WHERE p.deleted_at IS NULL
      GROUP BY p.id
      HAVING available_stock <= p.min_stock * 1.5
      ORDER BY available_stock ASC
    `).all()
    
    return c.json({
      success: true, 
      products: results || []
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Database error' 
    }, 500)
  }
})

// Yeni kategori ekle - created_at, updated_at kaldırıldı
router.post('/categories', async (c) => {
  const body = await c.req.json()
  const db = c.get('db')
  
  try {
    const result = await db.prepare(`
      INSERT INTO product_categories (name, description, status)
      VALUES (?, ?, ?)
    `).bind(
      body.name, 
      body.description, 
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

// Kategori sil
router.delete('/categories/:id', async (c) => {
  const { id } = c.req.param()
  const db = c.get('db')
  
  try {
    await db.prepare(`
      UPDATE product_categories 
      SET deleted_at = datetime('now')
      WHERE id = ?
    `).bind(id).run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Database error' 
    }, 500)
  }
})

// Ürün detayı
router.get('/:id', async (c) => {
  const { id } = c.req.param()
  const db = c.get('db')
  
  try {
    const product = await db.prepare(`
      SELECT p.*, pc.name as category_name
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      WHERE p.id = ? AND p.deleted_at IS NULL
    `).bind(id).first()
    
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

// Ürün listesi endpoint'ini güncelle - SQL'i düzelt
router.get('/', async (c) => {
  const db = c.get('db')
  
  const { searchParams } = new URL(c.req.url)
  const category_id = searchParams.get('category_id')
  const search = searchParams.get('search')
  
  try {
    let sql = `
      SELECT 
        p.*,
        pc.name as category_name,
        COALESCE(p.base_price, 0) as base_price, -- Fiyat null kontrolü eklendi
        (
          SELECT COUNT(*) 
          FROM product_materials 
          WHERE product_id = p.id 
          AND deleted_at IS NULL
        ) as recipe_count
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      WHERE p.deleted_at IS NULL
    `
    const params: any[] = []

    if (category_id) {
      sql += ' AND p.category_id = ?'
      params.push(category_id)
    }

    if (search) {
      sql += ' AND (p.name LIKE ? OR p.description LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    sql += ' ORDER BY p.name'

    const { results } = await db.prepare(sql).bind(...params).all()
    
    return c.json({
      success: true,
      products: results || []
    })
  } catch (error) {
    console.error('Products list error:', error)
    return c.json({ 
      success: false, 
      error: 'Database error',
      message: error.message 
    }, 500)
  }
})

// Yeni ürün ekle - created_at ve updated_at kaldırıldı
router.post('/', async (c) => {
  const body = await c.req.json()
  const db = c.get('db')
  
  try {
    console.log('Ürün kaydetme isteği:', body);

    // Gerekli alan kontrolü
    if (!body.name || !body.category_id || !body.base_price) {
      return c.json({
        success: false,
        error: 'Eksik veya geçersiz veri',
        details: 'Ad, kategori ve fiyat alanları zorunludur'
      }, 400);
    }

    // 1. Ürünü kaydet - created_at ve updated_at alanlarını kaldır
    const result = await db.prepare(`
      INSERT INTO products (
        category_id, name, description,
        base_price, status
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(
      parseInt(body.category_id) || null,
      body.name,
      body.description || null,
      parseFloat(body.base_price) || 0,
      body.status || 'active'
    ).run()

    const product_id = result.meta?.last_row_id
    if (!product_id) throw new Error('Ürün ID alınamadı')

    // 2. Malzemeleri kaydet - created_at kaldırıldı, is_required yerine notes kullanıldı
    if (Array.isArray(body.materials) && body.materials.length > 0) {
      for (const material of body.materials) {
        try {
          if (!material.material_id || !material.quantity) continue;
          
          await db.prepare(`
            INSERT INTO product_materials (
              product_id, material_id, default_quantity, notes
            ) VALUES (?, ?, ?, ?)
          `).bind(
            product_id,
            parseInt(material.material_id),
            parseFloat(material.quantity),
            material.notes || null
          ).run()
        } catch (materialError) {
          console.error('Malzeme ekleme hatası:', materialError, 'Malzeme:', material);
        }
      }
    }

    return c.json({ 
      success: true, 
      id: product_id,
      message: 'Ürün başarıyla kaydedildi'
    })
  } catch (error) {
    console.error('Ürün kaydetme hatası:', error);
    return c.json({ 
      success: false, 
      error: error.message,
      details: 'Veritabanı işlemi sırasında bir hata oluştu'
    }, 500)
  }
})

// Ürün güncelleme - updated_at kaldırıldı
router.put('/:id', async (c) => {
  const { id } = c.req.param()
  const body = await c.req.json()
  const db = c.get('db')
  
  try {
    await db.prepare(`
      UPDATE products 
      SET 
        category_id = ?,
        name = ?,
        description = ?,
        base_price = ?,
        status = ?
      WHERE id = ? AND deleted_at IS NULL
    `).bind(
      body.category_id,
      body.name,
      body.description,
      body.base_price,
      body.status,
      id
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
  
  try {
    await db.prepare(`
      UPDATE products 
      SET deleted_at = datetime('now')
      WHERE id = ?
    `).bind(id).run()

    return c.json({ success: true })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Database error' 
    }, 500)
  }
})

// Ürün reçetelerini getir 
router.get('/recipes/:orderId', async (c) => {
    const db = c.get('db')
    const { orderId } = c.req.param()

    console.log('Loading recipes for order:', orderId); // Debug log

    try {
        // Debug log
        console.log('Executing recipe query...');
        
        const { results } = await db.prepare(`
            WITH order_products AS (
                SELECT oi.product_id, oi.quantity as order_quantity
                FROM order_items oi 
                WHERE oi.order_id = ? AND oi.deleted_at IS NULL
            )
            SELECT 
                rm.id as material_id,
                rm.name as material_name,
                u.code as unit_code,
                pm.default_quantity * op.order_quantity as suggested_quantity
            FROM order_products op
            JOIN product_materials pm ON op.product_id = pm.product_id
            JOIN raw_materials rm ON pm.material_id = rm.id
            JOIN units u ON rm.unit_id = u.id
            WHERE pm.deleted_at IS NULL 
            AND rm.deleted_at IS NULL
        `).bind(orderId).all()

        console.log('Recipe results:', results); // Debug log

        return c.json({
            success: true,
            recipes: results || []
        })

    } catch (error) {
        console.error('Recipe query error:', error); // Debug log
        return c.json({
            success: false,
            error: 'Database error',
            details: error.message
        }, 500)
    }
})

// Sipariş için reçete önerisi - ÖNEMLİ HATA DÜZELTİLDİ
router.get('/recipes/:orderId', async (c) => {
    const { orderId } = c.req.param();
    const db = c.get('db')
    
    try {
        // Sorguyu geliştir: Ürün ID ve adını doğru şekilde ekle
        const { results } = await db.prepare(`
            SELECT 
                oi.product_id,
                p.name as product_name,
                pm.material_id,
                rm.name as material_name,
                u.code as unit_code,
                (pm.default_quantity * oi.quantity) as suggested_quantity
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            JOIN product_materials pm ON p.id = pm.product_id AND pm.deleted_at IS NULL
            JOIN raw_materials rm ON pm.material_id = rm.id
            JOIN units u ON rm.unit_id = u.id
            WHERE oi.order_id = ?
            AND oi.deleted_at IS NULL
            ORDER BY oi.product_id, rm.name
        `).bind(orderId).all();
        
        return c.json({
            success: true, 
            recipes: results || []
        });
    } catch (error) {
        console.error('Recipe suggestion error:', error);
        return c.json({
            success: false,
            error: 'Database error',
            details: error.message
        }, 500);
    }
});

export default router