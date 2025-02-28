-- "confirmed" durumunu kaldır ve mevcut siparişleri güncelle

-- Önce mevcut "confirmed" durumunda olan siparişleri "new" olarak güncelle
UPDATE orders SET status = 'new' WHERE status = 'confirmed';

-- Ardından constraint'i güncelle
CREATE TABLE orders_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    recipient_id INTEGER NOT NULL,
    address_id INTEGER NOT NULL,
    delivery_date DATE NOT NULL,
    delivery_time TEXT CHECK(delivery_time IN ('morning','afternoon','evening')) NOT NULL,
    delivery_region TEXT NOT NULL,
    delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    status TEXT CHECK(status IN ('new','preparing','ready','delivering','delivered','cancelled')) DEFAULT 'new',
    status_notes TEXT,
    -- diğer kolonlar aynen kalsın
    total_amount DECIMAL(10,2) NOT NULL CHECK(total_amount >= 0),
    paid_amount DECIMAL(10,2) DEFAULT 0 CHECK(paid_amount >= 0),
    payment_status TEXT CHECK(payment_status IN ('pending','partial','paid','cancelled')) DEFAULT 'pending',
    card_message_id INTEGER,
    custom_card_message TEXT,
    customer_notes TEXT,
    internal_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER,
    deleted_at DATETIME,
    prepared_by INTEGER,
    preparation_start DATETIME,
    preparation_end DATETIME,
    delivered_at DATETIME,
    delivered_by INTEGER,
    delivery_proof TEXT,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (recipient_id) REFERENCES recipients(id),
    FOREIGN KEY (address_id) REFERENCES addresses(id),
    FOREIGN KEY (card_message_id) REFERENCES card_messages(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    FOREIGN KEY (prepared_by) REFERENCES users(id),
    FOREIGN KEY (delivered_by) REFERENCES users(id)
);

-- Verileri yeni tabloya kopyala
INSERT INTO orders_new SELECT * FROM orders;

-- Eski tabloyu sil ve yeniyi adlandır
DROP TABLE orders;
ALTER TABLE orders_new RENAME TO orders;
