import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
export async function PUT(req, { params }) {
  const { typeName } = await req.json()
  const row = await prisma.productType.update({ where: { typeId: Number(params.id) }, data: { typeName } })
  return NextResponse.json(row)
}
export async function DELETE(_, { params }) {
  await prisma.productType.delete({ where: { typeId: Number(params.id) } })
  return NextResponse.json({ ok: true })
}
