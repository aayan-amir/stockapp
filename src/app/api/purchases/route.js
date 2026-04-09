export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  const where = q
    ? { OR: [
        { invoiceNo:    { contains: q } },
        { supplierName: { contains: q } },
        { stock: { OR: [{ ourNo: { contains: q } }, { description: { contains: q } }] } },
      ], transactionType: 'Purchase' }
    : { transactionType: 'Purchase' }

  const rows = await prisma.sale.findMany({
    where, orderBy: { txDate: 'desc' },
    include: { stock: true },
  })
  return NextResponse.json(rows)
}

export async function POST(req) {
  const b   = await req.json()
  const sid = Number(b.stockId)
  const qty = Number(b.quantity)

  if (!sid || qty <= 0) return NextResponse.json({ error: 'stockId and quantity required' }, { status: 400 })

  const row = await prisma.sale.create({
    data: {
      invoiceNo:       b.invoiceNo || null,
      transactionType: 'Purchase',
      txDate:          b.txDate ? new Date(b.txDate) : new Date(),
      stockId:         sid,
      supplierName:    b.supplierName    || null,
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

  // Atomic stock update
  await prisma.$executeRaw`
    UPDATE "Stock"
    SET "stockIn"  = "stockIn" + ${qty},
        "quantity" = "stockIn" + ${qty} - "stockOut",
        "lastUpdated" = NOW()
    WHERE "stockId" = ${sid}
  `

  if (Object.prototype.hasOwnProperty.call(b, 'supplierName') && b.supplierName !== undefined) {
    await prisma.stock.update({
      where: { stockId: sid },
      data: { supplier: b.supplierName || null },
    })
  }

  return NextResponse.json(row, { status: 201 })
}
