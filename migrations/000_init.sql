-- Sıralı migration çalıştırma
PRAGMA foreign_keys = OFF;

-- Ana tabloları yükle
.read '001_core.sql'
.read '002_stock.sql'
.read '003_products.sql'
.read '004_customers.sql'
.read '005_orders.sql'

-- İndeksleri yükle
.read '100_indexes.sql'

-- Görünümleri yükle
.read '200_views.sql'

-- Triggerları yükle
.read '300_triggers.sql'

PRAGMA foreign_keys = ON;
