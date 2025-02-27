import { Hono } from 'hono'
import { cors } from 'hono/cors'

// Route imports
import dashboardRoutes from './routes/dashboard'
import customerRoutes from './routes/customers'
import orderRoutes from './routes/orders'
import financeRoutes from './routes/finance'
import addressRoutes from './routes/addresses'
import productRoutes from './routes/products'
import stockRoutes from './routes/stock'
import suppliersRoutes from './routes/suppliers'
import materialsRouter from './routes/materials'
import purchaseRoutes from './routes/purchase'
import settingsRoutes from './routes/settings'
import workshopRoutes from './routes/workshop'

const app = new Hono()

// CORS ve middleware'ler
app.use('*', cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length', 'X-Total-Count'],  // Pagination için eklendi
    maxAge: 600,
    credentials: true
}))

app.use('*', async (c, next) => {
    // DB bağlantısı
    c.set('db', c.env.DB)
    
    await next()
})

// API Routes
const api = new Hono()

// Core routes
api.route('/dashboard', dashboardRoutes)
api.route('/settings', settingsRoutes)

// Customer related
api.route('/customers', customerRoutes)
api.route('/addresses', addressRoutes)

// Order related 
api.route('/orders', orderRoutes)
api.route('/workshop', workshopRoutes)

// Product related
api.route('/products', productRoutes)
api.route('/materials', materialsRouter)

// Finance & Stock
api.route('/finance', financeRoutes)
api.route('/stock', stockRoutes)
api.route('/purchase', purchaseRoutes)
api.route('/suppliers', suppliersRoutes)

// Mount all routes under /api
app.route('/api', api)

// 404 handler for API
app.all('/api/*', (c) => {
    console.log('404 Not Found:', c.req.url)
    return c.json({
        success: false,
        error: 'API endpoint not found'
    }, 404)
})

// Static file handler
app.get('*', (c) => {
    return c.env.ASSETS.fetch(c.req)
})

// Global error handler
app.onError((err, c) => {
    console.error('[Application Error]:', {
        url: c.req.url,
        method: c.req.method,
        error: err.message,
        stack: err.stack
    })
    
    return c.json({
        success: false,
        error: err.message || 'Internal Server Error',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, err.status || 500)
})

export default app