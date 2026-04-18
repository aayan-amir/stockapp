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

  // Get existing record
  const existing = await prisma.sale.findUnique({ where: { saleId: Number(id) } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const oldQty = existing.quantity
  const oldSid = existing.stockId
  const qtyDiff = newQty - oldQty

  // Live stock check: available = current stock + qty already sold (old) - new qty requested
  // If same stock: available after edit = stock.quantity + oldQty - newQty
  // If different stock: new stock must have >= newQty available
  if (oldSid === sid) {
    const stock = await prisma.stock.findUnique({ where: { stockId: sid } })
    const wouldBe = (stock?.quantity ?? 0) + oldQty - newQty
    if (wouldBe < 0)
      return NextResponse.json({ error: `Only ${(stock?.quantity ?? 0) + oldQty} unit(s) available` }, { status: 400 })
  } else {
    const stock = await prisma.stock.findUnique({ where: { stockId: sid } })
    if ((stock?.quantity ?? 0) < newQty)
      return NextResponse.json({ error: `Only ${stock?.quantity ?? 0} unit(s) available` }, { status: 400 })
  }

  // Update sale record
  const row = await prisma.sale.update({
    where: { saleId: Number(id) },
    data: {
      invoiceNo:  b.invoiceNo  || null,
      txDate:     b.txDate ? new Date(b.txDate) : existing.txDate,
      stockId:    sid,
      customerId: b.customerId ? Number(b.customerId) : null,
      quantity:   newQty,
      notes:      b.notes || null,
    },
  })

  // Adjust stock
  if (oldSid && oldSid !== sid) {
    // Reverse old sale on old stock
    await prisma.$executeRaw`
      UPDATE "Stock"
      SET "stockOut" = GREATEST(0, "stockOut" - ${oldQty}),
          "quantity" = "stockIn" - GREATEST(0, "stockOut" - ${oldQty}),
          "lastUpdated" = NOW()
      WHERE "stockId" = ${oldSid}
    `
    // Apply new sale on new stock
    await prisma.$executeRaw`
      UPDATE "Stock"
      SET "stockOut" = "stockOut" + ${newQty},
          "quantity" = "stockIn" - ("stockOut" + ${newQty}),
          "lastUpdated" = NOW()
      WHERE "stockId" = ${sid}
    `
  } else if (oldSid && qtyDiff !== 0) {
    // Same stock, adjust difference
    await prisma.$executeRaw`
      UPDATE "Stock"
      SET "stockOut" = "stockOut" + ${qtyDiff},
          "quantity" = "stockIn" - ("stockOut" + ${qtyDiff}),
          "lastUpdated" = NOW()
      WHERE "stockId" = ${sid}
    `
  }

  return NextResponse.json(row)
}

export async function DELETE(_, { params }) {
  const { id } = await params
  // Reverse stock movement before deleting
  const row = await prisma.sale.findUnique({ where: { saleId: Number(id) } })
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const qty = row.quantity
  const sid = row.stockId

  await prisma.sale.delete({ where: { saleId: Number(id) } })

  if (sid) {
    if (row.transactionType === 'Sale') {
      await prisma.$executeRaw`
        UPDATE "Stock"
        SET "stockOut" = GREATEST(0, "stockOut" - ${qty}),
            "quantity" = "stockIn" - GREATEST(0, "stockOut" - ${qty}),
            "lastUpdated" = NOW()
        WHERE "stockId" = ${sid}
      `
    } else {
      await prisma.$executeRaw`
        UPDATE "Stock"
        SET "stockIn"  = GREATEST(0, "stockIn" - ${qty}),
            "quantity" = GREATEST(0, "stockIn" - ${qty}) - "stockOut",
            "lastUpdated" = NOW()
        WHERE "stockId" = ${sid}
      `
    }
  }
  return NextResponse.json({ ok: true })
}
