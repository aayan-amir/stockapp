import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req) {
  const type = new URL(req.url).searchParams.get('type') || 'Sale'
  const prefix = type === 'Sale' ? 'SALE' : 'PO'
  const today  = new Date().toISOString().slice(0, 10).replace(/-/g, '')

  const last = await prisma.sale.findFirst({
    where: { transactionType: type, invoiceNo: { startsWith: `${prefix}-${today}` } },
    orderBy: { invoiceNo: 'desc' },
  })

  let seq = 1
  if (last?.invoiceNo) {
    const parts = last.invoiceNo.split('-')
    seq = (parseInt(parts[parts.length - 1]) || 0) + 1
  }

  return NextResponse.json({ invoiceNo: `${prefix}-${today}-${String(seq).padStart(3, '0')}` })
}
