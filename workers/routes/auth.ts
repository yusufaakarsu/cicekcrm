import { Hono } from 'hono'
import { setCookie, getCookie } from 'hono/cookie'

const router = new Hono()

// Basit login endpoint'i
router.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json()
    const db = c.get('db')
    
    // E-posta ile kullanıcıyı bul
    const user = await db.prepare(`
      SELECT id, name, email, password_hash, status
      FROM users
      WHERE email = ? AND deleted_at IS NULL
    `).bind(email).first()
    
    // Kullanıcı bulunamadı veya şifre yanlış
    if (!user || user.password_hash !== password) { // Gerçekte şifre hashlenmeli!
      return c.json({ 
        success: false, 
        error: 'Geçersiz e-posta veya şifre' 
      }, 401)
    }
    
    // Kullanıcı pasif durumda
    if (user.status === 'passive') {
      return c.json({ 
        success: false, 
        error: 'Hesap aktif değil' 
      }, 403)
    }
    
    // Basit bir session token oluştur (gerçekte bu daha güvenli olmalı)
    const sessionToken = crypto.randomUUID()
    
    // Session veritabanına kaydet
    await db.prepare(`
      INSERT INTO user_sessions (user_id, token, expires_at)
      VALUES (?, ?, datetime('now', '+24 hours'))
    `).bind(user.id, sessionToken).run()
    
    // Session token'ı cookie'ye kaydet
    setCookie(c, 'session_token', sessionToken, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 60 * 60 * 24 // 1 gün
    })
    
    return c.json({ 
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    })
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ 
      success: false, 
      error: 'Giriş yapılamadı: ' + error.message
    }, 500)
  }
})

// GET ile login işlevselliği
router.get('/login', async (c) => {
  try {
    const email = c.req.query('email');
    const password = c.req.query('password');
    const db = c.get('db');
    
    if (!email || !password) {
      return c.json({ 
        success: false, 
        error: 'E-posta ve şifre gereklidir' 
      }, 400);
    }
    
    // E-posta ile kullanıcıyı bul
    const user = await db.prepare(`
      SELECT id, name, email, password_hash, status
      FROM users
      WHERE email = ? AND deleted_at IS NULL
    `).bind(email).first();
    
    // Kullanıcı bulunamadı veya şifre yanlış
    if (!user || user.password_hash !== password) { // Gerçekte şifre hashlenmeli!
      return c.json({ 
        success: false, 
        error: 'Geçersiz e-posta veya şifre' 
      }, 401)
    }
    
    // Kullanıcı pasif durumda
    if (user.status === 'passive') {
      return c.json({ 
        success: false, 
        error: 'Hesap aktif değil' 
      }, 403)
    }
    
    // Basit bir session token oluştur (gerçekte bu daha güvenli olmalı)
    const sessionToken = crypto.randomUUID()
    
    // Session veritabanına kaydet
    await db.prepare(`
      INSERT INTO user_sessions (user_id, token, expires_at)
      VALUES (?, ?, datetime('now', '+24 hours'))
    `).bind(user.id, sessionToken).run()
    
    // Session token'ı cookie'ye kaydet
    setCookie(c, 'session_token', sessionToken, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 60 * 60 * 24 // 1 gün
    })
    
    return c.json({ 
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    })
  } catch (error) {
    console.error('Login GET error:', error);
    return c.json({ 
      success: false, 
      error: 'Giriş yapılamadı: ' + error.message
    }, 500);
  }
});

// Çıkış endpoint'i
router.post('/logout', async (c) => {
  const sessionToken = getCookie(c, 'session_token')
  
  if (sessionToken) {
    const db = c.get('db')
    
    // Session'ı veritabanından sil
    await db.prepare(`
      UPDATE user_sessions 
      SET expires_at = datetime('now', '-1 second')
      WHERE token = ?
    `).bind(sessionToken).run()
    
    // Cookie'yi temizle
    setCookie(c, 'session_token', '', {
      path: '/',
      maxAge: 0
    })
  }
  
  return c.json({ success: true })
})

// Kimlik doğrulama kontrolü için middleware
export async function authMiddleware(c, next) {
  const sessionToken = getCookie(c, 'session_token')
  
  if (!sessionToken) {
    return c.json({ 
      success: false, 
      error: 'Oturum açmanız gerekiyor' 
    }, 401)
  }
  
  const db = c.get('db')
  
  try {
    // Geçerli bir session var mı kontrol et
    const session = await db.prepare(`
      SELECT user_id
      FROM user_sessions
      WHERE token = ?
      AND expires_at > datetime('now')
    `).bind(sessionToken).first()
    
    if (!session) {
      return c.json({ 
        success: false, 
        error: 'Oturum süresi dolmuş' 
      }, 401)
    }
    
    // Kullanıcıyı al
    const user = await db.prepare(`
      SELECT id, name, email, status
      FROM users
      WHERE id = ? AND deleted_at IS NULL
    `).bind(session.user_id).first()
    
    if (!user || user.status !== 'active') {
      return c.json({ 
        success: false, 
        error: 'Geçersiz hesap' 
      }, 403)
    }
    
    // Kullanıcı bilgilerini context'e ekle
    c.set('user', user)
    
    await next()
    
  } catch (error) {
    return c.json({ 
      success: false, 
      error: 'Kimlik doğrulama hatası' 
    }, 500)
  }
}

export default router
