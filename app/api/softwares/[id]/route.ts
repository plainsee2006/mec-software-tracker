import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const sw = await prisma.software.findUnique({
    where: { id },
    include: { vendor: true, category: true, assignments: { include: { user: true } } },
  });
  if (!sw) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(sw);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    const body = await req.json();

    const data: any = {
      name: body.name,
      owner: body.owner ?? null,
      description: body.description ?? null,
      licenseCount: Number(body.licenseCount ?? 1),
      expDate: body.expDate ? new Date(body.expDate) : null,
      pricePerUnit: body.pricePerUnit ?? null,
      totalPrice: body.totalPrice ?? null,
      monthlyPrice: body.monthlyPrice ?? null,
      notes: body.notes ?? null,
    };

    if (body.vendorNew) {
      const v = await prisma.vendor.upsert({
        where: { name: body.vendorNew },
        create: { name: body.vendorNew },
        update: {},
      });
      data.vendorId = v.id;
    } else if (body.vendorId) {
      data.vendorId = body.vendorId;
    } else {
      data.vendorId = null;
    }

    if (body.categoryNew) {
      const c = await prisma.category.upsert({
        where: { name: body.categoryNew },
        create: { name: body.categoryNew },
        update: {},
      });
      data.categoryId = c.id;
    } else if (body.categoryId) {
      data.categoryId = body.categoryId;
    } else {
      data.categoryId = null;
    }

    const updated = await prisma.software.update({ where: { id }, data });

    // เคลียร์ notification log เพื่อให้แจ้งใหม่ตามวันหมดอายุที่เปลี่ยน
    if (body.expDate !== undefined) {
      await prisma.notificationLog.deleteMany({ where: { softwareId: id } });
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  await prisma.software.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
