export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
export async function PUT(req, { params }) {
  const { id } = await params
  const b = await req.json()
  const row = await prisma.taxRate.update({
    where: { taxRateId: Number(id) },
    data: { taxName: b.taxName, taxRatePercent: Number(b.taxRatePercent), description: b.description || null },
  })
  return NextResponse.json(row)
}
export async function DELETE(_, { params }) {
  const { id } = await params
  await prisma.taxRate.delete({ where: { taxRateId: Number(id) } })
  return NextResponse.json({ ok: true })
}
