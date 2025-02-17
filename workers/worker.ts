import { Hono } from 'hono'
import { cors } from 'hono/cors'
import orderRoutes from './routes/orders'

const api = new Hono()

api.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization']
}))

api.use('*', async (c, next) => {
  c.set('db', c.env.DB)
  c.set('tenant_id', 1)
  await next()
})

// Şimdilik sadece sipariş route'larını ekleyelim
api.route('/api/orders', orderRoutes)

export default api
