import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(_, { params }) {
  const s = await prisma.stock.findUnique({
    where: { stockId: Number(params.id) }, include: { productType: true },
  })
  if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(s)
}

export async function PUT(req, { params }) {
  const b = await req.json()
  const s = await prisma.stock.update({
    where: { stockId: Number(params.id) },
    data: {
      typeId:               b.typeId  ? Number(b.typeId)  : null,
      ourNo:                b.ourNo   || null,
      oemNo:                b.oemNo   || null,
      stockType:            b.stockType   || null,
      description:          b.description || null,
      supplier:             b.supplier    || null,
      foreignCurrency:      b.foreignCurrency      || null,
      foreignCurrencyPrice: b.foreignCurrencyPrice ? Number(b.foreignCurrencyPrice) : null,
    },
  })
  return NextResponse.json(s)
}

export async function DELETE(_, { params }) {
  await prisma.stock.delete({ where: { stockId: Number(params.id) } })
  return NextResponse.json({ ok: true })
}
