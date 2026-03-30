export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
export async function PUT(req, { params }) {
  const b = await req.json()
  const row = await prisma.rate.update({
    where: { rateId: Number(params.id) },
    data: { currencyCode: b.currencyCode, currencyName: b.currencyName, exchangeRateToPKR: Number(b.exchangeRateToPKR) },
  })
  return NextResponse.json(row)
}
export async function DELETE(_, { params }) {
  await prisma.rate.delete({ where: { rateId: Number(params.id) } })
  return NextResponse.json({ ok: true })
}
