-- Sıralı migration çalıştırma
PRAGMA foreign_keys = OFF;

-- 1. Core sistem
.read '001_core_schema.sql'        -- Tenants, Users, Settings

-- 2. Ana tablolar
.read '002_stock.sql'             -- Stock units, Suppliers
.read '003_products.sql'          -- Products, Types, Categories
.read '004_customers.sql'         -- Customers, Addresses
.read '005_orders.sql'           -- Orders, Items, Recipes

-- 3. İndeks ve Performans
.read '100_indexes.sql'          -- Tüm indeksler

-- 4. Views
.read '200_views.sql'            -- Raporlama görünümleri

-- 5. Triggers
.read '300_triggers.sql'         -- Otomatik işlemler

-- 6. Örnek Veriler (Development/Test için)
.read '401_seed_base.sql'        -- Tenants ve ayarlar
.read '402_seed_regions.sql'     -- Bölgeler ve temel veriler
.read '403_seed_customers.sql'   -- Müşteriler
.read '404_seed_products.sql'    -- Ürünler
.read '405_seed_orders.sql'      -- Siparişler

PRAGMA foreign_keys = ON;
