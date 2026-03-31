export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const [rates, taxRates, categories, customers, stocks, sales] = await Promise.all([
    prisma.rate.findMany(),
    prisma.taxRate.findMany(),
    prisma.productType.findMany(),
    prisma.customer.findMany(),
    prisma.stock.findMany(),
    prisma.sale.findMany({ include: { stock: true, customer: true } }),
  ])

  const backup = {
    exportedAt: new Date().toISOString(),
    rates,
    taxRates,
    categories,
    customers,
    stocks,
    sales,
  }

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="stockapp-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  })
}
