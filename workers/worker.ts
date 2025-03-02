import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { setCookie, getCookie } from 'hono/cookie'
import { authMiddleware } from './routes/auth'

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
import authRoutes from './routes/auth'

const app = new Hono()

// CORS yapılandırması
app.use('*', cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposeHeaders: ['Content-Length', 'X-Total-Count'],
    maxAge: 600,
    credentials: true,
    preflightContinue: true
}))

// Veritabanı bağlantısı middleware
app.use('*', async (c, next) => {
    c.set('db', c.env.DB)
    await next()
})

// Auth rotalarını ayrıca doğrudan kaydet - kimlik doğrulama kontrolü olmadan
app.route('/api/auth', authRoutes)

// API Routes - kimlik doğrulamalı
const api = new Hono()

// Kimlik doğrulaması gerektiren tüm rotaları middleware ile koruyalım
api.use('/*', authMiddleware)

// İş rotalarını ekle
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

// Root URL için özel yönlendirme
app.get('/', (c) => {
    const sessionToken = getCookie(c, 'session_token')
    
    // Oturum yoksa login sayfasına yönlendir
    if (!sessionToken) {
        return c.redirect('/login.html')
    }
    
    // Oturum varsa dashboard'a yönlendir
    return c.redirect('/index.html')
})

// Statik dosya sunucu - auth kontrolü ile
app.get('*', async (c) => {
    const url = new URL(c.req.url)
    const path = url.pathname
    
    // Login sayfası ve statik asset'ler için kimlik doğrulama atla
    if (path === '/login.html' || 
        path.startsWith('/common/') || 
        path.endsWith('.css') || 
        path.endsWith('.js') || 
        path.endsWith('.ico')) {
        return c.env.ASSETS.fetch(c.req)
    }
    
    // HTML sayfaları için oturum kontrolü yap
    const sessionToken = getCookie(c, 'session_token')
    if (!sessionToken && path.endsWith('.html')) {
        return c.redirect('/login.html')
    }
    
    // Normal şekilde dosyaları sun
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