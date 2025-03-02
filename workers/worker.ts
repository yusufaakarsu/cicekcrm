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
import deliveryRoutes from './routes/delivery'

const app = new Hono()

// CORS yapılandırması
app.use('*', cors({
    origin: ['https://app.shirincicek.com', 'http://localhost:8787', '*'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Accept'],
    exposeHeaders: ['Content-Length', 'X-Total-Count', 'Set-Cookie'],
    maxAge: 600,
    credentials: true
}))

// Veritabanı bağlantısı middleware
app.use('*', async (c, next) => {
    c.set('db', c.env.DB)
    await next()
})

// Cache-Control başlıkları
app.use('*', async (c, next) => {
  await next()
  
  // API yanıtları için cache-control başlıkları
  if (c.req.url.includes('/api/')) {
    c.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    c.header('Pragma', 'no-cache')
    c.header('Expires', '0')
  }
})

// API Routes - kimlik doğrulaması kaldırıldı
const api = new Hono()

// İş rotalarını ekle - auth middleware kaldırıldı
api.route('/dashboard', dashboardRoutes)
api.route('/settings', settingsRoutes)
api.route('/customers', customerRoutes)
api.route('/addresses', addressRoutes)
api.route('/orders', orderRoutes)
api.route('/workshop', workshopRoutes)
api.route('/delivery', deliveryRoutes)
api.route('/products', productRoutes)
api.route('/materials', materialsRouter)
api.route('/finance', financeRoutes)
api.route('/stock', stockRoutes)
api.route('/purchases', purchaseRoutes)
api.route('/suppliers', suppliersRoutes)

// API endpoint'lerini /api altına monte et
app.route('/api', api)

// 404 handler for API
app.all('/api/*', (c) => {
    console.log('404 Not Found:', c.req.url)
    return c.json({
        success: false,
        error: 'API endpoint not found'
    }, 404)
})

// Root URL için doğrudan index.html yönlendirmesi
app.get('/', (c) => {
    return c.redirect('/index.html');
})

// Statik dosya sunucusu - auth kontrolü kaldırıldı
app.get('*', async (c) => {
    // Normal şekilde dosyaları sun - artık kimlik doğrulama kontrolü yok
    return c.env.ASSETS.fetch(c.req)
})

// Genel hata işleyici
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