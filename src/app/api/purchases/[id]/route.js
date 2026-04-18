export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PUT(req, { params }) {
  const { id } = await params
  const b = await req.json()
  const sid = Number(b.stockId)
  const newQty = Number(b.quantity)

  if (!sid || newQty <= 0)
    return NextResponse.json({ error: 'stockId and quantity required' }, { status: 400 })

  // Get existing record to calculate stock diff
  const existing = await prisma.sale.findUnique({ where: { saleId: Number(id) } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const oldQty = existing.quantity
  const oldSid = existing.stockId
  const qtyDiff = newQty - oldQty

  // Update the sale record
  const row = await prisma.sale.update({
    where: { saleId: Number(id) },
    data: {
      invoiceNo:    b.invoiceNo    || null,
      gdNumber:     b.gdNumber     || null,
      txDate:       b.txDate ? new Date(b.txDate) : existing.txDate,
      stockId:      sid,
      supplierName: b.supplierName || null,
      quantity:     newQty,
      notes:        b.notes        || null,
    },
  })

  // Adjust stock: if stockId changed, reverse old and apply new
  if (oldSid && oldSid !== sid) {
    // Reverse old stock
    await prisma.$executeRaw`
      UPDATE "Stock"
      SET "stockIn"  = GREATEST(0, "stockIn" - ${oldQty}),
          "quantity" = GREATEST(0, "stockIn" - ${oldQty}) - "stockOut",
          "lastUpdated" = NOW()
      WHERE "stockId" = ${oldSid}
    `
    // Apply full qty to new stock
    await prisma.$executeRaw`
      UPDATE "Stock"
      SET "stockIn"  = "stockIn" + ${newQty},
          "quantity" = "stockIn" + ${newQty} - "stockOut",
          "lastUpdated" = NOW()
      WHERE "stockId" = ${sid}
    `
  } else if (oldSid && qtyDiff !== 0) {
    // Same stock item, just adjust the difference
    await prisma.$executeRaw`
      UPDATE "Stock"
      SET "stockIn"  = "stockIn" + ${qtyDiff},
          "quantity" = "stockIn" + ${qtyDiff} - "stockOut",
          "lastUpdated" = NOW()
      WHERE "stockId" = ${sid}
    `
  }

  if (b.supplierName !== undefined) {
    await prisma.stock.update({
      where: { stockId: sid },
      data: { supplier: b.supplierName || null },
    })
  }

  return NextResponse.json(row)
}

export async function DELETE(_, { params }) {
  const { id } = await params
  const row = await prisma.sale.findUnique({ where: { saleId: Number(id) } })
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const qty = row.quantity
  const sid = row.stockId

  await prisma.sale.delete({ where: { saleId: Number(id) } })

  // Reverse the stock-in
  if (sid) {
    await prisma.$executeRaw`
      UPDATE "Stock"
      SET "stockIn"  = GREATEST(0, "stockIn" - ${qty}),
          "quantity" = GREATEST(0, "stockIn" - ${qty}) - "stockOut",
          "lastUpdated" = NOW()
      WHERE "stockId" = ${sid}
    `
  }

  return NextResponse.json({ ok: true })
}
