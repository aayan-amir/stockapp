export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const now   = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const [
    totalStockItems,
    totalStockValue,
    lowStockItems,
    monthSales,
    monthPurchases,
    recentTx,
    topProducts,
  ] = await Promise.all([
    prisma.stock.count(),
    prisma.stock.aggregate({ _sum: { quantity: true } }),
    prisma.stock.count({ where: { quantity: { lte: 5, gt: 0 } } }),
    prisma.sale.aggregate({
      where: { transactionType: 'Sale', txDate: { gte: start, lte: end } },
      _sum: { totalPKR: true }, _count: true,
    }),
    prisma.sale.aggregate({
      where: { transactionType: 'Purchase', txDate: { gte: start, lte: end } },
      _sum: { totalPKR: true }, _count: true,
    }),
    prisma.sale.findMany({
      take: 8, orderBy: { txDate: 'desc' },
      include: { stock: { select: { ourNo: true, description: true } }, customer: { select: { customerName: true } } },
    }),
    prisma.sale.groupBy({
      by: ['stockId'], where: { transactionType: 'Sale' },
      _sum: { quantity: true, totalPKR: true },
      orderBy: { _sum: { totalPKR: 'desc' } }, take: 5,
    }),
  ])

  // Enrich top products with stock details
  const stockIds  = topProducts.map(t => t.stockId).filter(Boolean)
  const stockRows = await prisma.stock.findMany({
    where: { stockId: { in: stockIds } },
    select: { stockId: true, ourNo: true, description: true },
  })
  const stockMap = Object.fromEntries(stockRows.map(s => [s.stockId, s]))

  return NextResponse.json({
    totalStockItems,
    totalStockQty:      totalStockValue._sum.quantity || 0,
    lowStockItems,
    monthSalesPKR:      monthSales._sum.totalPKR      || 0,
    monthSalesCount:    monthSales._count,
    monthPurchasesPKR:  monthPurchases._sum.totalPKR  || 0,
    monthPurchasesCount:monthPurchases._count,
    recentTx,
    topProducts: topProducts.map(t => ({
      ...t, stock: stockMap[t.stockId] || null,
    })),
  })
}
