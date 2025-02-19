import { Hono } from 'hono';

const app = new Hono();

// Temel endpoint
app.get('/', async (c) => {
    return c.json({
        success: true,
        message: 'Dashboard henüz hazırlanmadı'
    });
});

export default app;
