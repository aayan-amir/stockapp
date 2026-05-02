export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  const where = q
    ? { OR: [
        { invoiceNo:    { contains: q } },
        { gdNumber:     { contains: q } },
        { supplierName: { contains: q } },
        { stock: { OR: [{ ourNo: { contains: q } }, { description: { contains: q } }] } },
        { items: { some: { stock: { OR: [{ ourNo: { contains: q } }, { name: { contains: q } }, { description: { contains: q } }] } } } },
      ], transactionType: 'Purchase' }
    : { transactionType: 'Purchase' }

  const rows = await prisma.sale.findMany({
    where, orderBy: { txDate: 'desc' },
    include: { stock: true, items: { include: { stock: true } } },
  })
  return NextResponse.json(rows)
}

export async function POST(req) {
  const b     = await req.json()
  const items = Array.isArray(b.items) ? b.items : []

  if (items.length === 0) return NextResponse.json({ error: 'At least one item is required' }, { status: 400 })

  for (const item of items) {
    const sid = Number(item.stockId)
    const qty = Number(item.quantity)
    if (!sid || qty <= 0) return NextResponse.json({ error: 'Each item needs a product and quantity > 0' }, { status: 400 })
  }

  const row = await prisma.sale.create({
    data: {
      invoiceNo:        b.invoiceNo    || null,
      gdNumber:         b.gdNumber     || null,
      transactionType:  'Purchase',
      txDate:           b.txDate ? new Date(b.txDate) : new Date(),
      supplierName:     b.supplierName || null,
      quantity:         0,
      unitPriceFCY:     0,
      currencyCode:     'PKR',
      exchangeRateUsed: 1,
      taxRateUsed:      0,
      freightPKR:       0,
      otherChargesPKR:  0,
      totalPKR:         0,
      notes:            b.notes || null,
      items: {
        create: items.map(item => ({
          stockId:  Number(item.stockId),
          quantity: Number(item.quantity),
        })),
      },
    },
    include: { items: { include: { stock: true } } },
  })

  for (const item of items) {
    const sid = Number(item.stockId)
    const qty = Number(item.quantity)
    await prisma.$executeRaw`
      UPDATE "Stock"
      SET "stockIn"  = "stockIn" + ${qty},
          "quantity" = "stockIn" + ${qty} - "stockOut",
          "lastUpdated" = NOW()
      WHERE "stockId" = ${sid}
    `
  }

  if (b.supplierName) {
    // Update supplier on all purchased stock items
    for (const item of items) {
      await prisma.stock.update({
        where: { stockId: Number(item.stockId) },
        data: { supplier: b.supplierName },
      })
    }
  }

  return NextResponse.json(row, { status: 201 })
}
