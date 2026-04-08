export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(_, { params }) {
  const { id } = await params
  const s = await prisma.stock.findUnique({
    where: { stockId: Number(id) }, include: { productType: true },
  })
  if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(s)
}

export async function PUT(req, { params }) {
  const { id } = await params
  const b = await req.json()
  const s = await prisma.stock.update({
    where: { stockId: Number(id) },
    data: {
      typeId:               b.typeId  ? Number(b.typeId)  : null,
      ourNo:                b.ourNo   || null,
      oemNo:                b.oemNo   || null,
      name:                 b.name    || null,
      stockType:            b.stockType   || null,
      description:          b.description || null,
      supplier:             b.supplier    || null,
    },
  })
  return NextResponse.json(s)
}

export async function DELETE(_, { params }) {
  const { id } = await params
  await prisma.stock.delete({ where: { stockId: Number(id) } })
  return NextResponse.json({ ok: true })
}
