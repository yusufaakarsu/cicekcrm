import { Hono } from 'hono'
import { cors } from 'hono/cors'
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

const app = new Hono()

// CORS - Development için tüm originlere izin ver
app.use('*', cors({
    origin: '*', // Development için. Production'da kısıtlanmalı
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true
}))

// Worker middleware
app.use('*', async (c, next) => {
    // DB ve tenant tanımlama
    c.set('db', c.env.DB)
    c.set('tenant_id', 1) // Test için sabit tenant
    
    // Request logging
    console.log(`${c.req.method} ${c.req.url}`)
    
    try {
        await next()
    } catch (err) {
        // Error logging
        console.error('Request failed:', err)
        throw err
    }
})

// Ana API rotaları
app.route('/api/dashboard', dashboardRoutes)  // Dashboard en üstte
app.route('/api/finance', financeRoutes)      // Finans ikinci sırada
app.route('/api/orders', orderRoutes)         // Siparişler
app.route('/api/customers', customerRoutes)    // Müşteriler
app.route('/api/products', productRoutes)      // Ürünler
app.route('/api/stock', stockRoutes)          // Stok
app.route('/api/addresses', addressRoutes)     // Adresler
app.route('/api/suppliers', suppliersRoutes)   // Tedarikçiler
app.route('/api/materials', materialsRouter)   // Hammaddeler
app.route('/api/purchase', purchaseRoutes)     // Satın alma

// 404 handler
app.notFound((c) => {
    console.log('404 Not Found:', c.req.url)
    return c.json({
        success: false,
        error: 'Not Found',
        path: c.req.url
    }, 404)
})

// Error handler
app.onError((err, c) => {
    console.error('Application Error:', err)
    return c.json({
        success: false,
        error: 'Server Error',
        message: err.message
    }, 500)
})

export default app