import { Context } from 'hono';
import { D1Database } from '@cloudflare/workers-types';

// Alıcı kaydetme fonksiyonunda kontrolü güçlendir
async function saveRecipient(db, data) {
  // Önce var olan aynı isim/telefona sahip alıcıyı kontrol et
  const existingRecipient = await db.prepare(`
    SELECT id FROM recipients 
    WHERE customer_id = ? AND phone = ? AND name = ? AND deleted_at IS NULL
  `).bind(data.customer_id, data.phone, data.name).first();
  
  if (existingRecipient) {
    return existingRecipient.id; // Eğer varsa mevcut ID'yi döndür
  }
  
  // Yoksa yeni alıcı ekle
  const recipientResult = await db.prepare(`
    INSERT INTO recipients (
      customer_id, name, phone, 
      notes, special_dates
    ) VALUES (?, ?, ?, ?, ?)
  `).bind(
    data.customer_id,
    data.name,
    data.phone,
    data.notes || null,
    null // special_dates - gerekirse doldurulabilir
  ).run();

  return recipientResult.meta?.last_row_id;
}

// Sipariş oluşturma fonksiyonu
export async function createOrder(c: Context, db: D1Database, body: any) {
  try {
    console.log('Order request body:', body);

    // 1. Önce alıcı (recipient) kaydı yap
    const recipient_id = await saveRecipient(db, {
      customer_id: body.customer_id,
      name: body.recipient_name,
      phone: body.recipient_phone,
      notes: body.recipient_note
    });
    if (!recipient_id) throw new Error('Alıcı kaydedilemedi');

    // 2. Siparişi kaydet - tablo şemasına uygun alanlar
    const orderResult = await db.prepare(`
      INSERT INTO orders (
        customer_id,          -- 1
        recipient_id,         -- 2 
        address_id,           -- 3
        delivery_date,        -- 4 
        delivery_time,        -- 5
        delivery_region,      -- 6
        delivery_fee,         -- 7
        status,               -- 8
        total_amount,         -- 9
        payment_status,       -- 10
        custom_card_message,  -- 11
        customer_notes,       -- 12
        created_by,           -- 13
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      body.customer_id,            // 1
      recipient_id,                // 2 
      body.address_id,             // 3
      body.delivery_date,          // 4
      body.delivery_time,          // 5
      "Istanbul",                  // 6 - default delivery region
      body.delivery_fee || 0,      // 7 - default delivery fee
      'new',                       // 8 - default status
      body.total_amount,           // 9
      'pending',                   // 10 - default payment_status
      body.card_message || null,   // 11
      body.recipient_note || null, // 12 - customer/recipient notes
      1                            // 13 - created_by (default to admin for now)
    ).run();

    const order_id = orderResult.meta?.last_row_id;
    if (!order_id) throw new Error('Sipariş kaydedilemedi');

    // 3. Sipariş kalemlerini ekle
    for (const item of body.items) {
      await db.prepare(`
        INSERT INTO order_items (
          order_id, product_id, 
          quantity, unit_price, total_amount,
          notes
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        order_id,
        item.product_id,
        item.quantity,
        item.unit_price,
        item.total_amount || (item.quantity * item.unit_price),
        item.notes || null
      ).run();
    }

    return {
      success: true,
      order: {
        id: order_id
      }
    };

  } catch (error) {
    // Hata detaylarını logla
    console.error('[Order Error]:', {
      message: error.message,
      stack: error.stack
    });
    
    throw error;
  }
}

// Teslimat bilgilerini kaydetme fonksiyonu
export async function saveDeliveryInfo(c: Context, db: D1Database, body: any) {
  try {
    // Zorunlu alanları kontrol et
    const required = ['delivery_date', 'delivery_time_slot', 'recipient_name', 'recipient_phone'];
    for (const field of required) {
      if (!body[field]) {
        return {
          success: false,
          error: `${field} alanı zorunludur`
        };
      }
    }

    // Adres bilgisi kontrolü
    if (!body.address_id && !body.new_address) {
      return {
        success: false, 
        error: "Teslimat adresi gereklidir"
      };
    }

    // Yeni adres varsa önce onu kaydet
    let delivery_address_id = body.address_id;
    if (body.new_address) {
      const addressResult = await db.prepare(`
        INSERT INTO addresses (
          customer_id, district, city, street, building_no, 
          label, neighborhood, floor_no, door_no, directions, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        body.customer_id,
        body.new_address.district,
        'İstanbul',
        body.new_address.street,
        body.new_address.building_no,
        'Teslimat Adresi',
        body.new_address.neighborhood || null,
        body.new_address.floor || null,
        body.new_address.door_no || null,
        body.new_address.directions || null
      ).run();

      delivery_address_id = addressResult.meta?.last_row_id;
    }

    // Sipariş teslimat bilgilerini oluştur
    const result = await db.prepare(`
      INSERT INTO orders (
        customer_id, delivery_date, delivery_time,
        recipient_name, recipient_phone,
        recipient_note, custom_card_message, address_id,
        status, payment_status, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', 'pending', 1, datetime('now'), datetime('now'))
    `).bind(
      body.customer_id,
      body.delivery_date,
      body.delivery_time_slot,
      body.recipient_name,
      body.recipient_phone,
      body.recipient_note || null,
      body.card_message || null,
      delivery_address_id
    ).run();

    return {
      success: true,
      order_id: result.meta?.last_row_id
    };

  } catch (error) {
    console.error("Teslimat bilgileri kaydedilemedi:", error);
    throw error;
  }
}
