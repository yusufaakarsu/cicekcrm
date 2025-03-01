import { Hono } from 'hono';

const router = new Hono();

// Günün teslimatlarını getir
router.get('/today', async (c) => {
    const db = c.get('db');

    try {
        // Bugün ve sonrası için teslimat listesi
        const { results } = await db.prepare(`
            SELECT 
                o.id, 
                o.delivery_date,
                o.delivery_time,
                o.status,
                o.total_amount,
                o.customer_notes,
                o.internal_notes,
                c.name as customer_name, 
                c.phone as customer_phone,
                r.name as recipient_name,
                r.phone as recipient_phone,
                a.district, 
                a.neighborhood,
                a.street,
                a.building_no,
                a.floor_no,
                a.door_no,
                a.lat,
                a.lng,
                a.directions,
                (SELECT GROUP_CONCAT(p.name || ' x' || oi.quantity)
                 FROM order_items oi
                 JOIN products p ON oi.product_id = p.id
                 WHERE oi.order_id = o.id AND oi.deleted_at IS NULL
                ) as product_summary
            FROM orders o
            JOIN customers c ON o.customer_id = c.id
            JOIN recipients r ON o.recipient_id = r.id
            JOIN addresses a ON o.address_id = a.id
            WHERE DATE(o.delivery_date) >= DATE('now')
            AND DATE(o.delivery_date) <= DATE('now', '+1 day')
            AND o.status NOT IN ('cancelled', 'delivered')
            AND o.deleted_at IS NULL
            ORDER BY 
                o.delivery_date,
                CASE o.delivery_time
                    WHEN 'morning' THEN 1
                    WHEN 'afternoon' THEN 2
                    WHEN 'evening' THEN 3
                    ELSE 4
                END
        `).all();
        
        // Her teslimat için tam adres bilgisini oluştur
        const deliveries = results.map(delivery => {
            // Adres birleştirme
            const addressParts = [
                delivery.street,
                delivery.building_no ? `No: ${delivery.building_no}` : null,
                delivery.floor_no ? `Kat: ${delivery.floor_no}` : null,
                delivery.door_no ? `Daire: ${delivery.door_no}` : null,
                delivery.neighborhood,
                delivery.district
            ].filter(Boolean);
            
            const address = addressParts.join(', ');
            
            return {
                ...delivery,
                address,
                order_number: `#${delivery.id.toString().padStart(4, '0')}`,
                // Koordinat varsa kullan, yoksa örnek koordinatlar ver
                lat: delivery.lat || 41.0082 + Math.random() * 0.05 - 0.025, // Teslimat verisi yoksa rastgele koordinatlar
                lng: delivery.lng || 28.9784 + Math.random() * 0.05 - 0.025  // İstanbul merkezinde
            };
        });
        
        return c.json({
            success: true,
            deliveries
        });
        
    } catch (error) {
        console.error('Delivery data error:', error);
        return c.json({
            success: false,
            error: 'Teslimat verileri yüklenemedi: ' + error.message
        }, 500);
    }
});

// Teslimat durumu güncelle
router.post('/update-status/:id', async (c) => {
    const db = c.get('db');
    const id = c.req.param('id');
    const body = await c.req.json();
    
    try {
        if (!body.status) {
            return c.json({
                success: false,
                error: 'Status is required'
            }, 400);
        }
        
        // Durumu güncelle
        await db.prepare(`
            UPDATE orders
            SET status = ?, updated_at = datetime('now')
            WHERE id = ? AND deleted_at IS NULL
        `).bind(body.status, id).run();
        
        // "delivering" durumu için teslimat başlangıç zamanını kaydet
        if (body.status === 'delivering') {
            await db.prepare(`
                UPDATE orders
                SET delivered_at = datetime('now')
                WHERE id = ? AND deleted_at IS NULL
            `).bind(id).run();
        }
        
        return c.json({
            success: true,
            message: 'Teslimat durumu güncellendi'
        });
        
    } catch (error) {
        console.error('Update delivery status error:', error);
        return c.json({
            success: false,
            error: 'Teslimat durumu güncellenemedi: ' + error.message
        }, 500);
    }
});

// Kurye konumunu güncelle
router.post('/courier-location', async (c) => {
    const body = await c.req.json();
    
    try {
        // Bu endpoint için veritabanı işlemleri gerekiyor, ancak şimdilik sadece başarılı yanıt döndürelim
        // Gerçek uygulamada veritabanına konum kaydedilir
        
        return c.json({
            success: true,
            message: 'Konum güncellendi'
        });
        
    } catch (error) {
        console.error('Update courier location error:', error);
        return c.json({
            success: false,
            error: 'Konum güncellenemedi'
        }, 500);
    }
});

// Teslimat notunu güncelle
router.post('/update-note/:id', async (c) => {
    const db = c.get('db');
    const id = c.req.param('id');
    const body = await c.req.json();
    
    try {
        await db.prepare(`
            UPDATE orders
            SET internal_notes = ?, updated_at = datetime('now')
            WHERE id = ? AND deleted_at IS NULL
        `).bind(body.note || '', id).run();
        
        return c.json({
            success: true,
            message: 'Teslimat notu güncellendi'
        });
        
    } catch (error) {
        console.error('Update delivery note error:', error);
        return c.json({
            success: false,
            error: 'Teslimat notu güncellenemedi'
        }, 500);
    }
});

export default router;
