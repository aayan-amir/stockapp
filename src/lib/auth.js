// Simple cookie-based PIN auth.
// In production, replace with NextAuth or a proper session library.
const COOKIE = 'sms_auth'
const PIN    = process.env.ACCESS_PIN || '1234'

export function isAuthenticated(req) {
  const cookies = req.cookies || {}
  const token   = cookies.get ? cookies.get(COOKIE)?.value : cookies[COOKIE]
  return token === PIN
}

export function setAuthCookie(res, pin) {
  if (pin !== PIN) return false
  res.cookies.set(COOKIE, pin, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge:   60 * 60 * 8, // 8 hours
    path:     '/',
  })
  return true
}

export function clearAuthCookie(res) {
  res.cookies.set(COOKIE, '', { maxAge: 0, path: '/' })
}
