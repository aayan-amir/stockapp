import { NextResponse } from 'next/server'

const PIN    = process.env.ACCESS_PIN || '1234'
const COOKIE = 'sms_auth'

export async function POST(req) {
  const { pin } = await req.json()
  if (pin !== PIN) {
    return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE, pin, {
    httpOnly: true, sameSite: 'lax',
    maxAge: 60 * 60 * 8, path: '/',
  })
  return res
}
