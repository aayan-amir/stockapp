import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
export async function GET() {
  return NextResponse.json(await prisma.taxRate.findMany({ orderBy: { taxName: 'asc' } }))
}
export async function POST(req) {
  const b = await req.json()
  const row = await prisma.taxRate.create({
    data: { taxName: b.taxName, taxRatePercent: Number(b.taxRatePercent), description: b.description || null },
  })
  return NextResponse.json(row, { status: 201 })
}
