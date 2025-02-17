import { Hono } from 'hono'
import { cors } from 'hono/cors'
import dashboardRoutes from './routes/dashboard'
import customerRoutes from './routes/customers'
import orderRoutes from './routes/orders'
import financeRoutes from './routes/finance'
import addressRoutes from './routes/addresses'
import productRoutes from './routes/products'

const app = new Hono()

// CORS middleware
app.use('*', cors())

// Global error handler
app.onError((err, c) => {
  console.error(`[Error] ${err.message}`);
  return c.json({
    success: false,
    error: 'Internal Server Error',
    message: err.message
  }, 500);
})

// Database middleware
app.use('*', async (c, next) => {
  if (c.req.url.includes('/api/')) {
    c.set('db', c.env.DB)
    c.set('tenant_id', 1)
  }
  await next()
})

// API Routes
app.route('/api/dashboard', dashboardRoutes)
app.route('/api/customers', customerRoutes)
app.route('/api/orders', orderRoutes)
app.route('/api/finance', financeRoutes)
app.route('/api/addresses', addressRoutes)
app.route('/api/products', productRoutes)

// Catch all for SPA
app.get('*', async c => {
  return c.text('Not Found', 404)
})

export default app
