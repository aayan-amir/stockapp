export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  const where = q
    ? { OR: [
        { invoiceNo: { contains: q } },
        { stock: { OR: [{ ourNo: { contains: q } }, { description: { contains: q } }] } },
        { customer: { customerName: { contains: q } } },
      ], transactionType: 'Sale' }
    : { transactionType: 'Sale' }

  const rows = await prisma.sale.findMany({
    where, orderBy: { txDate: 'desc' },
    include: { stock: true, customer: true },
  })
  return NextResponse.json(rows)
}

export async function POST(req) {
  const b   = await req.json()
  const sid = Number(b.stockId)
  const qty = Number(b.quantity)

  if (!sid || qty <= 0) return NextResponse.json({ error: 'stockId and quantity required' }, { status: 400 })

  // Live stock check
  const stock = await prisma.stock.findUnique({ where: { stockId: sid } })
  if (!stock) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  if (stock.quantity < qty)
    return NextResponse.json({ error: `Only ${stock.quantity} unit(s) in stock` }, { status: 400 })

  const row = await prisma.sale.create({
    data: {
      invoiceNo:       b.invoiceNo || null,
      transactionType: 'Sale',
      txDate:          b.txDate ? new Date(b.txDate) : new Date(),
      stockId:         sid,
      customerId:      b.customerId ? Number(b.customerId) : null,
      quantity:        qty,
      unitPriceFCY:    0,
      currencyCode:    'PKR',
      exchangeRateUsed:1,
      taxRateUsed:     0,
      freightPKR:      0,
      otherChargesPKR: 0,
      totalPKR:        0,
      notes:           b.notes || null,
    },
  })

  await prisma.$executeRawUnsafe(`
    UPDATE "Stock"
    SET "stockOut" = "stockOut" + ${qty},
        "quantity" = "stockIn"  - ("stockOut" + ${qty}),
        "lastUpdated" = datetime('now')
    WHERE "stockId" = ${sid}
  `)

  return NextResponse.json(row, { status: 201 })
}
