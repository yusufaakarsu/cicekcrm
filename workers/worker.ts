import { Hono } from 'hono'
import { cors } from 'hono/cors'
import orderRoutes from './routes/orders'

const api = new Hono()

// CORS middleware updated
api.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

// Base path middleware
api.use('/api/*', async (c, next) => {
  c.set('db', c.env.DB)
  c.set('tenant_id', 1)
  await next()
})

// Routes with /api prefix
api.route('/api/orders', orderRoutes)

export default api
