export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// Uses the free open.er-api.com — no key needed, 1500 req/month
export async function POST() {
  try {
    const res  = await fetch('https://open.er-api.com/v6/latest/PKR', { cache: 'no-store' })
    if (!res.ok) return NextResponse.json({ error: 'Exchange rate API unavailable' }, { status: 502 })
    const data = await res.json()
    if (data.result !== 'success') return NextResponse.json({ error: 'Bad API response' }, { status: 502 })

    // data.rates is keyed PKR-base, so rate[USD] = how many USD per 1 PKR
    // We want exchangeRateToPKR = 1 / data.rates[code]
    const existing = await prisma.rate.findMany()
    const updated  = []

    for (const row of existing) {
      if (row.currencyCode === 'PKR') continue
      const inverseRate = data.rates[row.currencyCode]
      if (!inverseRate) continue
      const exchangeRateToPKR = Math.round((1 / inverseRate) * 10000) / 10000
      await prisma.rate.update({
        where: { rateId: row.rateId },
        data:  { exchangeRateToPKR },
      })
      updated.push({ currencyCode: row.currencyCode, exchangeRateToPKR })
    }

    return NextResponse.json({ ok: true, updated, updatedAt: new Date().toISOString() })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
