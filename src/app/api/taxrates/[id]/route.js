import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
export async function PUT(req, { params }) {
  const b = await req.json()
  const row = await prisma.taxRate.update({
    where: { taxRateId: Number(params.id) },
    data: { taxName: b.taxName, taxRatePercent: Number(b.taxRatePercent), description: b.description || null },
  })
  return NextResponse.json(row)
}
export async function DELETE(_, { params }) {
  await prisma.taxRate.delete({ where: { taxRateId: Number(params.id) } })
  return NextResponse.json({ ok: true })
}
