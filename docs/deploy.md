wrangler d1 execute cicek-crm-db --remote --file=/Users/yusuf/Downloads/kod/CCRM/migrations/100_tables.sql

wrangler d1 execute cicek-crm-db --remote --file=/Users/yusuf/Downloads/kod/CCRM/migrations/200_seed_data.sql

wrangler d1 execute cicek-crm-db --remote --file=/Users/yusuf/Downloads/kod/CCRM/migrations/301_trg_purchase.sql

wrangler d1 execute cicek-crm-db --remote --file=/Users/yusuf/Downloads/kod/CCRM/migrations/302_trg_order.sql

wrangler d1 execute cicek-crm-db --remote --file=/Users/yusuf/Downloads/kod/CCRM/migrations/303_trg_finance.sql

wrangler d1 execute cicek-crm-db --remote --command "SELECT * FROM accounts;"

wrangler d1 execute cicek-crm-db --remote --command "SELECT * FROM transaction_categories;"


wrangler d1 execute cicek-crm-db --remote --file=/Users/yusuf/Downloads/kod/CCRM/migrations/202_seed_init_transaction.sql