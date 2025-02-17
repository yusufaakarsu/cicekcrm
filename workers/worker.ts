import { Hono } from 'hono'
import { cors } from 'hono/cors'
import orderRoutes from './routes/orders'
import dashboardRoutes from './routes/dashboard'
import customerRoutes from './routes/customers'
import addressRoutes from './routes/addresses'
import financeRoutes from './routes/finance'
import productRoutes from './routes/products'

const api = new Hono()

// CORS middleware
api.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

// Tüm /api route'larını tek bir yerde topla
api.use('/api/*', async (c, next) => {
  c.set('db', c.env.DB)
  c.set('tenant_id', 1)
  await next()
})

// Route'ları düzgün şekilde tanımla
api.route('/api/dashboard', dashboardRoutes)
api.route('/api/customers', customerRoutes) 
api.route('/api/orders', orderRoutes)
api.route('/api/addresses', addressRoutes)
api.route('/api/finance', financeRoutes)
api.route('/api/products', productRoutes)

export default api
