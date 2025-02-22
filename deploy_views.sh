
# Orders View
wrangler d1 execute cicek-crm-db --remote --file=/Users/yusuf/Downloads/kod/CCRM/migrations/402_order_views.sql

# Delivery View
wrangler d1 execute cicek-crm-db --remote --file=/Users/yusuf/Downloads/kod/CCRM/migrations/403_delivery_views.sql

# Finance View
wrangler d1 execute cicek-crm-db --remote --file=/Users/yusuf/Downloads/kod/CCRM/migrations/404_finance_views.sql

# Products View 
wrangler d1 execute cicek-crm-db --remote --file=/Users/yusuf/Downloads/kod/CCRM/migrations/405_product_views.sql

# Verify views
wrangler d1 execute cicek-crm-db --remote --command "SELECT name FROM sqlite_master WHERE type='view';"
