export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
export async function PUT(req, { params }) {
  const { id } = await params
  if (!Number.isInteger(Number(id))) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  const { typeName } = await req.json()
  const row = await prisma.productType.update({ where: { typeId: Number(id) }, data: { typeName } })
  return NextResponse.json(row)
}
export async function DELETE(_, { params }) {
  const { id } = await params
  if (!Number.isInteger(Number(id))) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  await prisma.productType.delete({ where: { typeId: Number(id) } })
  return NextResponse.json({ ok: true })
}
