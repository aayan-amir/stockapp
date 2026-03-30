import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(await prisma.rate.findMany({ orderBy: { currencyCode: 'asc' } }))
}
export async function POST(req) {
  const b = await req.json()
  const row = await prisma.rate.upsert({
    where: { currencyCode: b.currencyCode },
    update: { currencyName: b.currencyName, exchangeRateToPKR: Number(b.exchangeRateToPKR) },
    create: { currencyCode: b.currencyCode, currencyName: b.currencyName, exchangeRateToPKR: Number(b.exchangeRateToPKR) },
  })
  return NextResponse.json(row, { status: 201 })
}
