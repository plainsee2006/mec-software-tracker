import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    const body = await req.json();

    // ถ้ามี email ให้เช็คว่าซ้ำกับ user อื่นไหม
    if (body.email) {
      const existing = await prisma.user.findFirst({
        where: { email: body.email, NOT: { id } },
      });
      if (existing) {
        return NextResponse.json(
          { error: `Email ${body.email} มีอยู่ในระบบแล้ว (User ID: ${existing.id})` },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.user.update({ where: { id }, data: body });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
