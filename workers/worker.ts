import { Hono } from 'hono'
import { cors } from 'hono/cors'
import dashboardRoutes from './routes/dashboard'
import customerRoutes from './routes/customers'
import orderRoutes from './routes/orders'
import financeRoutes from './routes/finance'
import addressRoutes from './routes/addresses'  // Yeni eklenen
import productRoutes from './routes/products'
import stockRoutes from './routes/stock'
import suppliersRoutes from './routes/suppliers'
import materialsRouter from './routes/materials'
import purchaseRoutes from './routes/purchase'
import settingsRoutes from './routes/settings'  // Yeni eklenen
import workshopRoutes from './routes/workshop'

const app = new Hono()

// CORS middleware
app.use('*', cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true
}))

// Global middleware
app.use('*', async (c, next) => {
    c.set('db', c.env.DB)
    c.set('tenant_id', 1)
    await next()
})

// API Routes
const api = new Hono()
api.route('/finance', financeRoutes)
api.route('/settings', settingsRoutes)  // Yeni eklenen
api.route('/dashboard', dashboardRoutes)
api.route('/orders', orderRoutes)
api.route('/customers', customerRoutes)
api.route('/products', productRoutes)
api.route('/stock', stockRoutes)
api.route('/addresses', addressRoutes)  // Yeni eklenen
api.route('/suppliers', suppliersRoutes)
api.route('/materials', materialsRouter)
api.route('/purchase', purchaseRoutes)
api.route('/workshop', workshopRoutes)

// Mount API routes under /api
app.route('/api', api)

// Catch-all for API 404s
app.all('/api/*', (c) => {
    console.log('404 API:', c.req.url)
    return c.json({
        success: false,
        error: 'API endpoint not found'
    }, 404)
})

// Static files
app.get('*', (c) => {
    return c.env.ASSETS.fetch(c.req)
})

// Error handler
app.onError((err, c) => {
    console.error('App Error:', err)
    return c.json({
        success: false,
        error: 'Server Error',
        message: err.message
    }, 500)
})

export default app