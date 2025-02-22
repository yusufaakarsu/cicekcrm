#!/bin/bash

# 1. Git işlemleri
git add .
git commit -m "Stok yönetimi modülü eklendi"
git push origin development

# 2. Migrations
cd workers
wrangler d1 execute DB --file=../migrations/401_stock_views.sql

# 3. Worker deploy
wrangler deploy

# 4. Frontend dosyalarını Pages'e deploy et
cd ../public
wrangler pages deploy . --project-name cicek-crm
