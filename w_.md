```bash

wrangler d1 execute cicek-crm-db --remote --file=/Users/yusuf/Downloads/kod/CCRM/migrations/xxx.sql

wrangler d1 execute cicek-crm-db --remote --command "SELECT name as table_name FROM sqlite_master WHERE type='table' ORDER BY name;"


cat /Users/yusuf/Library/Preferences/.wrangler/logs/wrangler-2025-02-21_22-18-02_914.log

git add .
git commit -m "müşteriler bitti" 
git push origin development


cd workers
wrangler deploy


{
  "items": [
    {
      "title": "Invalidenstraße 117, 10115 Berlin, Deutschland",
      "id": "here:af:streetsection:tVuvjJYhO86yd5jk1cmzNB:CgcIBCCf2912EAEaAzExNyhk",
      "resultType": "houseNumber",
      "houseNumberType": "PA",
      "address": {
        "label": "Invalidenstraße 117, 10115 Berlin, Deutschland",
        "countryCode": "DEU",
        "countryName": "Deutschland",
        "stateCode": "BE",
        "state": "Berlin",
        "countyCode": "B",
        "county": "Berlin",
        "city": "Berlin",
        "district": "Mitte",
        "street": "Invalidenstraße",
        "postalCode": "10115",
        "houseNumber": "117"
      },
      "position": { "lat": 52.53041, "lng": 13.38527 },
      "access": [{ "lat": 52.53105, "lng": 13.3848 }],
      "mapView": { "west": 13.38379, "south": 52.52951, "east": 13.38675, "north": 52.53131 },
      "scoring": { "queryScore": 1, "fieldScore": { "city": 1, "streets": [1], "houseNumber": 1 } }
    }
  ]
}







```