export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

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
      await prisma.$executeRawUnsafe(`
        UPDATE "Stock"
        SET "stockOut" = max(0,"stockOut"-${qty}),
            "quantity" = "stockIn" - max(0,"stockOut"-${qty}),
            "lastUpdated" = datetime('now')
        WHERE "stockId" = ${sid}
      `)
    } else {
      await prisma.$executeRawUnsafe(`
        UPDATE "Stock"
        SET "stockIn"  = max(0,"stockIn"-${qty}),
            "quantity" = max(0,"stockIn"-${qty}) - "stockOut",
            "lastUpdated" = datetime('now')
        WHERE "stockId" = ${sid}
      `)
    }
  }
  return NextResponse.json({ ok: true })
}
