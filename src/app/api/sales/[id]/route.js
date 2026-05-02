export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(_, { params }) {
  const { id } = await params
  const row = await prisma.sale.findUnique({
    where: { saleId: Number(id) },
    include: { stock: true, customer: true, items: { include: { stock: true } } },
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

  // Reverse old stock movements: old SaleItems or legacy stockId/quantity
  const oldItems = existing.items.length > 0
    ? existing.items
    : (existing.stockId ? [{ stockId: existing.stockId, quantity: existing.quantity }] : [])

  for (const old of oldItems) {
    if (!old.stockId) continue
    const sid = old.stockId
    const qty = old.quantity
    await prisma.$executeRaw`
      UPDATE "Stock"
      SET "stockOut" = GREATEST(0, "stockOut" - ${qty}),
          "quantity" = "stockIn" - GREATEST(0, "stockOut" - ${qty}),
          "lastUpdated" = NOW()
      WHERE "stockId" = ${sid}
    `
  }

  // Validate new items stock availability
  for (const item of items) {
    const sid = Number(item.stockId)
    const qty = Number(item.quantity)
    const stock = await prisma.stock.findUnique({ where: { stockId: sid } })
    if (!stock) return NextResponse.json({ error: `Product ${sid} not found` }, { status: 404 })
    if (stock.quantity < qty)
      return NextResponse.json({ error: `Only ${stock.quantity} unit(s) available for "${stock.name || stock.description || sid}"` }, { status: 400 })
  }

  // Delete old SaleItems and create new ones
  await prisma.saleItem.deleteMany({ where: { saleId: Number(id) } })

  const row = await prisma.sale.update({
    where: { saleId: Number(id) },
    data: {
      invoiceNo:  b.invoiceNo  || null,
      txDate:     b.txDate ? new Date(b.txDate) : existing.txDate,
      customerId: b.customerId ? Number(b.customerId) : null,
      stockId:    null,
      quantity:   0,
      notes:      b.notes || null,
      items: {
        create: items.map(item => ({
          stockId:  Number(item.stockId),
          quantity: Number(item.quantity),
        })),
      },
    },
    include: { items: { include: { stock: true } }, customer: true },
  })

  // Apply new stock movements
  for (const item of items) {
    const sid = Number(item.stockId)
    const qty = Number(item.quantity)
    await prisma.$executeRaw`
      UPDATE "Stock"
      SET "stockOut" = "stockOut" + ${qty},
          "quantity" = "stockIn"  - ("stockOut" + ${qty}),
          "lastUpdated" = NOW()
      WHERE "stockId" = ${sid}
    `
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

  // Determine items to reverse
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
      SET "stockOut" = GREATEST(0, "stockOut" - ${qty}),
          "quantity" = "stockIn" - GREATEST(0, "stockOut" - ${qty}),
          "lastUpdated" = NOW()
      WHERE "stockId" = ${sid}
    `
  }

  return NextResponse.json({ ok: true })
}
