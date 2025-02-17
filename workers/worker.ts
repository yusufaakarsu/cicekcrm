import { Hono } from 'hono'
import { cors } from 'hono/cors'
import orderRoutes from './routes/orders'
import dashboardRoutes from './routes/dashboard'
import customerRoutes from './routes/customers'
import addressRoutes from './routes/addresses'
import financeRoutes from './routes/finance'
import productRoutes from './routes/products'

const app = new Hono()

// CORS middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type'],
  credentials: true,
}))

// Database ve tenant middleware
app.use('*', async (c, next) => {
  c.set('db', c.env.DB)
  c.set('tenant_id', 1) // Test için sabit tenant
  await next()
})

// Route'ları düzgün yerde tanımla
app.route('/api/dashboard', dashboardRoutes)
app.route('/api/customers', customerRoutes)
app.route('/api/orders', orderRoutes)
app.route('/api/addresses', addressRoutes)
app.route('/api/finance', financeRoutes)
app.route('/api/products', productRoutes)

// Catch-all error handler
app.onError((err, c) => {
  console.error('App Error:', err)
  return c.json({
    success: false,
    error: 'Internal Server Error',
    message: err.message
  }, 500)
})

export default app
