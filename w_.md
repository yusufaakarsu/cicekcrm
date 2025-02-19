
```bash

wrangler d1 execute cicek-crm-db --remote --file=/Users/yusuf/Downloads/kod/CCRM/migrations/xxx.sql

wrangler d1 execute cicek-crm-db --remote --command "SELECT name as table_name FROM sqlite_master WHERE type='table' ORDER BY name;"


git add .
git commit -m "basit açıklama" 
git push origin development

```
