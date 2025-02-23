```bash

wrangler d1 execute cicek-crm-db --remote --file=/Users/yusuf/Downloads/kod/CCRM/migrations/xxx.sql

wrangler d1 execute cicek-crm-db --remote --command "SELECT name as table_name FROM sqlite_master WHERE type='table' ORDER BY name;"


cat /Users/yusuf/Library/Preferences/.wrangler/logs/wrangler-2025-02-21_22-18-02_914.log
