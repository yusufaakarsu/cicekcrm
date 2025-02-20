```bash

wrangler d1 execute cicek-crm-db --remote --file=/Users/yusuf/Downloads/kod/CCRM/migrations/xxx.sql

wrangler d1 execute cicek-crm-db --remote --command "SELECT name as table_name FROM sqlite_master WHERE type='table' ORDER BY name;"




git add .
git commit -m "müüşteriler" 
git push origin development


cd workers
wrangler deploy


SELECT 
o.*,
(
SELECT GROUP_CONCAT(
oi.quantity || 'x ' || COALESCE(p.name, 'Silinmiş Ürün')
)
FROM order_items oi
LEFT JOIN products p ON oi.product_id = p.id
WHERE oi.order_id = o.id
AND oi.deleted_at IS NULL
) as items
FROM orders o
WHERE o.customer_id = 2
AND o.tenant_id = 1
AND o.deleted_at IS NULL
GROUP BY o.id
ORDER BY o.created_at DESC
LIMIT 10








```