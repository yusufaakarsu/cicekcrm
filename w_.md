```bash

wrangler d1 execute cicek-crm-db --remote --file=/Users/yusuf/Downloads/kod/CCRM/migrations/xxx.sql

wrangler d1 execute cicek-crm-db --remote --command "SELECT name as table_name FROM sqlite_master WHERE type='table' ORDER BY name;"




git add .
git commit -m "müüşteriler" 
git push origin development


cd workers
wrangler deploy


SELECT 
c.*,
COALESCE(
  (SELECT COUNT(*) 
    FROM orders o 
    WHERE o.customer_id = c.id 
    AND o.tenant_id = c.tenant_id 
    AND o.deleted_at IS NULL), 
0) as total_orders,
(SELECT created_at 
  FROM orders o 
  WHERE o.customer_id = c.id 
  AND o.tenant_id = c.tenant_id 
  AND o.deleted_at IS NULL 
  ORDER BY created_at DESC LIMIT 1) as last_order,
COALESCE(
  (SELECT SUM(total_amount) 
    FROM orders o 
    WHERE o.customer_id = c.id 
    AND o.tenant_id = c.tenant_id 
    AND o.deleted_at IS NULL), 
0) as total_spent
FROM customers c
WHERE c.id = 1
AND c.tenant_id = 1
AND c.deleted_at IS NULL








```