export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
export async function PUT(req, { params }) {
  const { id } = await params
  const b = await req.json()
  const row = await prisma.rate.update({
    where: { rateId: Number(id) },
    data: { currencyCode: b.currencyCode, currencyName: b.currencyName, exchangeRateToPKR: Number(b.exchangeRateToPKR) },
  })
  return NextResponse.json(row)
}
export async function DELETE(_, { params }) {
  const { id } = await params
  await prisma.rate.delete({ where: { rateId: Number(id) } })
  return NextResponse.json({ ok: true })
}
