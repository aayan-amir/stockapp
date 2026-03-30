import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
export async function GET() {
  return NextResponse.json(await prisma.productType.findMany({ orderBy: { typeName: 'asc' } }))
}
export async function POST(req) {
  const { typeName } = await req.json()
  const row = await prisma.productType.create({ data: { typeName } })
  return NextResponse.json(row, { status: 201 })
}
