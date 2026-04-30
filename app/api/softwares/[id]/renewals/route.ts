import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

// POST /api/softwares/[id]/renewals — บันทึกการต่ออายุ
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const softwareId = parseInt(params.id, 10);
    if (isNaN(softwareId)) {
      return NextResponse.json({ ok: false, error: "Invalid software id" }, { status: 400 });
    }

    const body = await req.json();
    const renewalDate = body.renewalDate ? new Date(body.renewalDate) : null;
    const expDateAfter = body.expDateAfter ? new Date(body.expDateAfter) : null;
    const amountPaid = body.amountPaid !== undefined && body.amountPaid !== null && body.amountPaid !== ""
      ? Number(body.amountPaid)
      : null;
    const vendor: string | null = body.vendor || null;
    const notes: string | null = body.notes || null;

    if (!renewalDate || isNaN(renewalDate.getTime())) {
      return NextResponse.json({ ok: false, error: "renewalDate ไม่ถูกต้อง" }, { status: 400 });
    }
    if (!expDateAfter || isNaN(expDateAfter.getTime())) {
      return NextResponse.json({ ok: false, error: "expDateAfter ไม่ถูกต้อง" }, { status: 400 });
    }

    const sw = await prisma.software.findUnique({
      where: { id: softwareId },
      select: { id: true, expDate: true, name: true },
    });
    if (!sw) {
      return NextResponse.json({ ok: false, error: "ไม่พบ Software" }, { status: 404 });
    }

    const username = await getCurrentUser();

    // 1) สร้าง Renewal
    const renewal = await prisma.renewal.create({
      data: {
        softwareId,
        renewalDate,
        expDateBefore: sw.expDate,
        expDateAfter,
        amountPaid,
        vendor,
        notes,
        createdBy: username,
      },
    });

    // 2) อัปเดต Software.expDate + status
    await prisma.software.update({
      where: { id: softwareId },
      data: {
        expDate: expDateAfter,
        status: expDateAfter < new Date() ? "expired" : "active",
      },
    });

    // 3) AuditLog (อัตโนมัติ)
    await prisma.auditLog.create({
      data: {
        entityType: "software",
        entityId: softwareId,
        action: "update",
        field: "expDate",
        valueBefore: sw.expDate ? JSON.stringify(sw.expDate) : null,
        valueAfter: JSON.stringify(expDateAfter),
        changedBy: username,
      },
    });

    return NextResponse.json({ ok: true, renewal });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// GET /api/softwares/[id]/renewals — ประวัติทั้งหมดของ Software นี้
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const softwareId = parseInt(params.id, 10);
  if (isNaN(softwareId)) {
    return NextResponse.json({ ok: false, error: "Invalid id" }, { status: 400 });
  }
  const items = await prisma.renewal.findMany({
    where: { softwareId },
    orderBy: { renewalDate: "desc" },
  });
  return NextResponse.json({ ok: true, items });
}
