import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

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
    const username = await getCurrentUser();

    // อ่าน state เก่ามาเพื่อทำ audit diff
    const before = await prisma.software.findUnique({
      where: { id },
      select: {
        name: true, owner: true, description: true, licenseCount: true,
        expDate: true, pricePerUnit: true, totalPrice: true, monthlyPrice: true,
        notes: true, vendorId: true, categoryId: true,
      },
    });

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

    // ถ้า expDate เปลี่ยนเอง (ไม่ใช่ต่อสัญญาผ่าน /renewals) → สร้าง Renewal อัตโนมัติด้วย
    const beforeExpIso = before?.expDate ? before.expDate.toISOString() : null;
    const afterExpIso = data.expDate ? data.expDate.toISOString() : null;
    if (before && beforeExpIso !== afterExpIso && data.expDate) {
      await prisma.renewal.create({
        data: {
          softwareId: id,
          renewalDate: new Date(),
          expDateBefore: before.expDate,
          expDateAfter: data.expDate,
          amountPaid: data.totalPrice ?? null,
          notes: "อัปเดตจากหน้า Edit",
          createdBy: username,
        },
      });
    }

    // Audit log — เก็บเฉพาะ field ที่เปลี่ยนจริง
    if (before) {
      const fields: Array<keyof typeof before> = [
        "name", "owner", "description", "licenseCount", "expDate",
        "pricePerUnit", "totalPrice", "monthlyPrice", "notes",
        "vendorId", "categoryId",
      ];
      for (const f of fields) {
        const a = (before as any)[f];
        const b = (data as any)[f];
        const aStr = a instanceof Date ? a.toISOString() : a;
        const bStr = b instanceof Date ? b.toISOString() : b;
        if (aStr !== bStr) {
          await prisma.auditLog.create({
            data: {
              entityType: "software",
              entityId: id,
              action: "update",
              field: f as string,
              valueBefore: a !== null && a !== undefined ? JSON.stringify(a) : null,
              valueAfter: b !== null && b !== undefined ? JSON.stringify(b) : null,
              changedBy: username,
            },
          });
        }
      }
    }

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
