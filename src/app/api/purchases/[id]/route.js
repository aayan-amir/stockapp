export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(_, { params }) {
  const { id } = await params
  const row = await prisma.sale.findUnique({
    where: { saleId: Number(id) },
    include: { stock: true, items: { include: { stock: true } } },
  })
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(row)
}

export async function PUT(req, { params }) {
  const { id } = await params
  const b = await req.json()
  const items = Array.isArray(b.items) ? b.items : []

  if (items.length === 0)
    return NextResponse.json({ error: 'At least one item is required' }, { status: 400 })

  for (const item of items) {
    const sid = Number(item.stockId)
    const qty = Number(item.quantity)
    if (!sid || qty <= 0) return NextResponse.json({ error: 'Each item needs a product and quantity > 0' }, { status: 400 })
  }

  const existing = await prisma.sale.findUnique({
    where: { saleId: Number(id) },
    include: { items: true },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Reverse old stock movements
  const oldItems = existing.items.length > 0
    ? existing.items
    : (existing.stockId ? [{ stockId: existing.stockId, quantity: existing.quantity }] : [])

  for (const old of oldItems) {
    if (!old.stockId) continue
    const sid = old.stockId
    const qty = old.quantity
    await prisma.$executeRaw`
      UPDATE "Stock"
      SET "stockIn"  = GREATEST(0, "stockIn" - ${qty}),
          "quantity" = GREATEST(0, "stockIn" - ${qty}) - "stockOut",
          "lastUpdated" = NOW()
      WHERE "stockId" = ${sid}
    `
  }

  // Delete old SaleItems and create new
  await prisma.saleItem.deleteMany({ where: { saleId: Number(id) } })

  const row = await prisma.sale.update({
    where: { saleId: Number(id) },
    data: {
      invoiceNo:    b.invoiceNo    || null,
      gdNumber:     b.gdNumber     || null,
      txDate:       b.txDate ? new Date(b.txDate) : existing.txDate,
      stockId:      null,
      supplierName: b.supplierName || null,
      quantity:     0,
      notes:        b.notes        || null,
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
    for (const item of items) {
      await prisma.stock.update({
        where: { stockId: Number(item.stockId) },
        data: { supplier: b.supplierName },
      })
    }
  }

  return NextResponse.json(row)
}

export async function DELETE(_, { params }) {
  const { id } = await params
  const row = await prisma.sale.findUnique({
    where: { saleId: Number(id) },
    include: { items: true },
  })
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const itemsToReverse = row.items.length > 0
    ? row.items
    : (row.stockId ? [{ stockId: row.stockId, quantity: row.quantity }] : [])

  await prisma.sale.delete({ where: { saleId: Number(id) } })

  for (const item of itemsToReverse) {
    if (!item.stockId) continue
    const sid = item.stockId
    const qty = item.quantity
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
