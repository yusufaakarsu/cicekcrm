# 1. Önce tabloları oluştur
wrangler d1 execute cicek-crm-db --remote --file=/Users/yusuf/Downloads/kod/CCRM/migrations/100_tables.sql

# 2. Trigger'ları yükle
wrangler d1 execute cicek-crm-db --remote --file=/Users/yusuf/Downloads/kod/CCRM/migrations/301_trg_purchase.sql
wrangler d1 execute cicek-crm-db --remote --file=/Users/yusuf/Downloads/kod/CCRM/migrations/302_trg_order.sql
wrangler d1 execute cicek-crm-db --remote --file=/Users/yusuf/Downloads/kod/CCRM/migrations/303_trg_finance.sql

# 3. Kasa ve kategori başlangıç verilerini yükle
wrangler d1 execute cicek-crm-db --remote --file=/Users/yusuf/Downloads/kod/CCRM/migrations/111_init_transaction.sql

# 4. Diğer seed verilerini yükle
wrangler d1 execute cicek-crm-db --remote --file=/Users/yusuf/Downloads/kod/CCRM/migrations/200_seed_data.sql

# Kontrol için:
wrangler d1 execute cicek-crm-db --remote --command "SELECT * FROM accounts;"
wrangler d1 execute cicek-crm-db --remote --command "SELECT * FROM transaction_categories;"
