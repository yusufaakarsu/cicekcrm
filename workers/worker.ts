import { Hono } from 'hono'
import { cors } from 'hono/cors'
import dashboardRoutes from './routes/dashboard'
import customerRoutes from './routes/customers'
import orderRoutes from './routes/orders'
import financeRoutes from './routes/finance'
import addressRoutes from './routes/addresses'
import productRoutes from './routes/products'
import stockRoutes from './routes/stock'

const app = new Hono()

// CORS middleware ve hata işleyicisi
app.use('*', cors())

app.onError((err, c) => {
  console.error(`[Error] ${err.message}`)
  return c.json({
    success: false,
    error: 'Internal Server Error',
    message: err.message
  }, 500)
})

// Middleware - DB ve tenant tanımlama
app.use('/api/*', async (c, next) => {
  c.set('db', c.env.DB)
  c.set('tenant_id', 1)
  await next()
})

// API Routes 
app.route('/api/stock', stockRoutes)      // Yeni route eklendi
app.route('/api/dashboard', dashboardRoutes)
app.route('/api/customers', customerRoutes)
app.route('/api/orders', orderRoutes)
app.route('/api/finance', financeRoutes)
app.route('/api/addresses', addressRoutes)
app.route('/api/products', productRoutes) // Düzeltildi

// 404 handler - Not Found
app.notFound((c) => c.json({
  success: false,
  error: 'Not Found',
  message: 'The requested resource was not found'
}, 404))

export default app