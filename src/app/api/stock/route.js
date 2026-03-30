import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const q     = searchParams.get('q') || ''
  const field = searchParams.get('field') || 'ourNo'
  const allowedFields = ['ourNo', 'oemNo', 'description', 'stockType', 'supplier']
  const where = q && allowedFields.includes(field)
    ? { [field]: { contains: q, mode: 'insensitive' } }
    : {}

  const stocks = await prisma.stock.findMany({
    where, orderBy: { ourNo: 'asc' }, include: { productType: true },
  })
  return NextResponse.json(stocks)
}

export async function POST(req) {
  const b = await req.json()
  const stock = await prisma.stock.create({
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
  return NextResponse.json(stock, { status: 201 })
}
