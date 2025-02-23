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

// CORS middleware ve hata işleyicisi
app.use('*', cors())

// Worker middleware - DB ve tenant tanımlama
app.use('*', async (c, next) => {
    // Debug için tüm istekleri logla
    console.log('Request:', c.req.method, c.req.url);
    
    c.set('db', c.env.DB);
    c.set('tenant_id', 1); // Test için sabit tenant
    await next();

    // Response logu
    console.log('Response:', c.res.status);
});

// Hata yakalama
app.onError((err, c) => {
    console.error('Application Error:', err);
    return c.json({
        success: false,
        error: 'Server Error',
        message: err.message
    }, 500);
});

// API Routes - Sıralama önemli
app.route('/api/stock', stockRoutes)
app.route('/api/dashboard', dashboardRoutes)
app.route('/api/customers', customerRoutes)
app.route('/api/orders', orderRoutes)
app.route('/api/finance', financeRoutes)
app.route('/api/addresses', addressRoutes)
app.route('/api/products', productRoutes)
app.route('/api/suppliers', suppliersRoutes)
app.route('/api/materials', materialsRouter)
app.route('/api/purchase', purchaseRoutes) // Purchase route'u en sona eklendi

// 404 handler - Not Found
app.notFound((c) => c.json({
  success: false,
  error: 'Not Found',
  message: 'The requested resource was not found'
}, 404))

export default app