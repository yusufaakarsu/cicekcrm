import { Hono } from 'hono'
import { cors } from 'hono/cors'
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
import deliveryRoutes from './routes/delivery' // Yeni teslimat rotası import ediliyor
import authRoutes from './routes/auth'

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
api.route('/delivery', deliveryRoutes) // Teslimat rotası eklendi

// Product related
api.route('/products', productRoutes)
api.route('/materials', materialsRouter)

// Finance & Stock
api.route('/finance', financeRoutes)
api.route('/stock', stockRoutes)
api.route('/purchases', purchaseRoutes)
api.route('/suppliers', suppliersRoutes)

// Auth routes - kimlik doğrulama gerektirmeyen rotalar
api.route('/auth', authRoutes)

// Korumalı rotalar - kimlik doğrulama gerektiren rotalar
const protectedRoutes = new Hono()

protectedRoutes.use('*', authMiddleware)

// Tüm korumalı rotaları ekle
protectedRoutes.route('/dashboard', dashboardRoutes)
protectedRoutes.route('/settings', settingsRoutes)
protectedRoutes.route('/customers', customerRoutes)
protectedRoutes.route('/addresses', addressRoutes)
protectedRoutes.route('/orders', orderRoutes)
protectedRoutes.route('/products', productRoutes)
protectedRoutes.route('/workshop', workshopRoutes)
protectedRoutes.route('/delivery', deliveryRoutes)
protectedRoutes.route('/finance', financeRoutes)
protectedRoutes.route('/stock', stockRoutes)
protectedRoutes.route('/purchases', purchaseRoutes)
protectedRoutes.route('/suppliers', suppliersRoutes)
protectedRoutes.route('/materials', materialsRouter)

// Korumalı rotaları ana API'ye ekle
api.route('/', protectedRoutes)

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

// Root URL için özel yönlendirme - doğrudan login sayfasına yönlendir
app.get('/', (c) => {
  // Token kontrol et ve yönlendir
  const sessionToken = getCookie(c, 'session_token');
  
  // Oturum yoksa login sayfasına yönlendir
  if (!sessionToken) {
    return c.redirect('/login.html');
  }
  
  // Oturum varsa dashboard'a yönlendir
  return c.redirect('/index.html');
});

// Login sayfasını koruma dışı tut ama diğer statik dosyaları kontrol et
app.get('*', async (c) => {
  const url = new URL(c.req.url);
  const path = url.pathname;
  
  // Login sayfası veya statik asset için oturum kontrolü yapmadan erişim ver
  if (path === '/login.html' || 
      path.startsWith('/common/') || 
      path.endsWith('.css') || 
      path.endsWith('.js') || 
      path.endsWith('.ico')) {
    return c.env.ASSETS.fetch(c.req);
  }
  
  // Diğer tüm HTML sayfaları için oturum kontrolü yap
  const sessionToken = getCookie(c, 'session_token');
  if (!sessionToken && path.endsWith('.html')) {
    return c.redirect('/login.html');
  }
  
  // Session token varsa veya HTML dosyası değilse, normal şekilde işle
  return c.env.ASSETS.fetch(c.req);
});

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