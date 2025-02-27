```bash

wrangler d1 execute cicek-crm-db --remote --file=/Users/yusuf/Downloads/kod/CCRM/migrations/000_tables.sql

wrangler d1 execute cicek-crm-db --remote --file=/Users/yusuf/Downloads/kod/CCRM/migrations/000_triggers.sql

wrangler d1 execute cicek-crm-db --remote --file=/Users/yusuf/Downloads/kod/CCRM/migrations/200_seed_data.sql

wrangler d1 execute cicek-crm-db --remote --command "SELECT name as table_name FROM sqlite_master WHERE type='table' ORDER BY name;"


cat /Users/yusuf/Library/Preferences/.wrangler/logs/wrangler-2025-02-21_22-18-02_914.log



{
    "title": "2302. Sokak, 34265, Uğur Mumcu, Sultangazi/İstanbul, Türkiye",
    "id": "here:af:streetsection:gg45W.JYZEiK6KGZxgk4KD",
    "resultType": "street",
    "address": {
        "label": "2302. Sokak, 34265, Uğur Mumcu, Sultangazi/İstanbul, Türkiye",
        "countryCode": "TUR",
        "countryName": "Türkiye",
        "county": "İstanbul",
        "city": "Sultangazi",
        "district": "Uğur Mumcu",
        "street": "2302. Sokak",
        "postalCode": "34265"
    },
    "position": {
        "lat": 41.10302,
        "lng": 28.86553
    },
    "mapView": {
        "west": 28.86439,
        "south": 41.10269,
        "east": 28.8667,
        "north": 41.10331
    },
    "scoring": {
        "queryScore": 0.99,
        "fieldScore": {
            "county": 1,
            "streets": [
                0.9
            ]
        }
    }
}


# Tabloları listele
wrangler d1 execute cicek-crm-db --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"

# Trigger'ları listele
wrangler d1 execute cicek-crm-db --remote --command "SELECT name FROM sqlite_master WHERE type='trigger' ORDER BY name;"

# Index'leri listele 
wrangler d1 execute cicek-crm-db --remote --command "SELECT name FROM sqlite_master WHERE type='index' ORDER BY name;"