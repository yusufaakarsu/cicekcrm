# CCRM Project Context Document

## Project Overview
This is a CRM/ERP system for a flower shop built with:
- Frontend: Static HTML + Vanilla JS + Bootstrap 
- Backend: Cloudflare Workers (TypeScript)
- Database: Cloudflare D1 (SQLite-based)
- Infrastructure: Cloudflare Pages (frontend) + Workers (API)

## Key Architecture Points

### Frontend (`/public`)
- No custom CSS, only Bootstrap 5
- Vanilla JavaScript (no frameworks)
- Modular structure by feature (customers, orders, etc)
- Common components in `/public/common`
- API communication via fetch() to Workers endpoints

### Backend (`/workers`)
- TypeScript-based Cloudflare Workers
- Hono framework for routing and middleware
- RESTful API design
- Routes organized by domain (`/routes/*.ts`)
- Global error handling and CORS enabled
- No local development, testing on Cloudflare subdomain

### Database (`/migrations`)
- SQLite-based Cloudflare D1 
- Core tables:
  - customers, recipients, addresses
  - orders, order_items, order_items_materials
  - products, product_materials, raw_materials
  - suppliers, purchase_orders
  - accounts, transactions
  - users, audit_log
- Key features:
  - Soft deletes (deleted_at)
  - Audit logging
  - Foreign key constraints
  - Status enums via CHECK constraints
  - Timestamp tracking
  - Double-entry accounting

### Business Domain
- Customer Management:
  - Customer profiles with recipients
  - Multiple delivery addresses
  - Order history tracking
  
- Order Processing:
  - Multi-status workflow
  - Delivery scheduling
  - Card messages
  - Product-material relationships
  
- Inventory:
  - Raw material tracking
  - Stock movements
  - Purchase order management
  
- Financial:
  - Multiple account types
  - Transaction categories
  - Payment tracking
  - Basic accounting

## Development Guidelines
1. All new tables must support soft delete
2. Use appropriate status enums via CHECK constraints
3. Always include audit fields (created_at, updated_at)
4. Maintain foreign key integrity
5. Follow RESTful API patterns
6. Document complex SQL queries
7. Use Bootstrap for all UI components
8. Keep frontend code vanilla JS
9. Handle errors gracefully with proper messages

## Testing
- No local development environment
- Testing done on Cloudflare development subdomain
- GitHub Pages auto-deployment from development branch
- Manual API testing via Postman/cURL

## Security Notes
- Authentication/Authorization to be added later
- Data validation both client & server side
- SQL injection prevention via prepared statements
