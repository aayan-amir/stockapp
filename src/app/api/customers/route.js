export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req) {
  const q = new URL(req.url).searchParams.get('q') || ''
  const rows = await prisma.customer.findMany({
    where: q ? { customerName: { contains: q } } : {},
    orderBy: { customerName: 'asc' },
  })
  return NextResponse.json(rows)
}

export async function POST(req) {
  const b = await req.json()
  if (!b.customerName) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  const row = await prisma.customer.create({
    data: {
      customerName: b.customerName,
      address:      b.address     || null,
      phoneNumber:  b.phoneNumber || null,
      email:        b.email       || null,
      filerStatus:  b.filerStatus || null,
      notes:        b.notes       || null,
    },
  })
  return NextResponse.json(row, { status: 201 })
}
