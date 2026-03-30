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
      unitPriceFCY:    Number(b.unitPriceFCY)    || 0,
      currencyCode:    b.currencyCode    || 'PKR',
      exchangeRateUsed:Number(b.exchangeRateUsed)|| 1,
      taxRateUsed:     Number(b.taxRateUsed)     || 0,
      freightPKR:      Number(b.freightPKR)      || 0,
      otherChargesPKR: Number(b.otherChargesPKR) || 0,
      totalPKR:        Number(b.totalPKR)        || 0,
      notes:           b.notes || null,
    },
  })

  // Atomic stock update
  await prisma.$executeRawUnsafe(`
    UPDATE "Stock"
    SET "stockIn"  = "stockIn" + ${qty},
        "quantity" = "stockIn" + ${qty} - "stockOut",
        "lastUpdated" = datetime('now')
    WHERE "stockId" = ${sid}
  `)

  if (Number(b.unitPriceFCY) > 0) {
    await prisma.stock.update({
      where: { stockId: sid },
      data: {
        foreignCurrencyPrice: Number(b.unitPriceFCY),
        foreignCurrency:      b.currencyCode || 'PKR',
        ...(b.supplierName ? { supplier: b.supplierName } : {}),
      },
    })
  }

  return NextResponse.json(row, { status: 201 })
}
