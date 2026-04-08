import { NextResponse } from 'next/server'

const COOKIE    = 'sms_auth'
const PIN       = process.env.ACCESS_PIN || '1234'
const PUBLIC    = ['/login', '/api/auth']

export function middleware(req) {
  const { pathname } = req.nextUrl
  if (PUBLIC.some(p => pathname.startsWith(p))) return NextResponse.next()
  const token = req.cookies.get(COOKIE)?.value
  if (token === PIN) return NextResponse.next()
  const url = req.nextUrl.clone()
  url.pathname = '/login'
  return NextResponse.redirect(url)
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] }
