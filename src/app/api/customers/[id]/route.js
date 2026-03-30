import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PUT(req, { params }) {
  const b = await req.json()
  const row = await prisma.customer.update({
    where: { customerId: Number(params.id) },
    data: {
      customerName: b.customerName,
      address:      b.address     || null,
      phoneNumber:  b.phoneNumber || null,
      email:        b.email       || null,
      filerStatus:  b.filerStatus || null,
      notes:        b.notes       || null,
    },
  })
  return NextResponse.json(row)
}

export async function DELETE(_, { params }) {
  await prisma.customer.delete({ where: { customerId: Number(params.id) } })
  return NextResponse.json({ ok: true })
}
