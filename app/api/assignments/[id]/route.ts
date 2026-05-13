import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

// PATCH /api/assignments/[id] — เปลี่ยน status ของ assignment
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ ok: false, error: "Invalid id" }, { status: 400 });
    }

    const body = await req.json();
    const status: string | undefined = body.status;
    if (status && !["Active", "Inactive", "Vacant"].includes(status)) {
      return NextResponse.json(
        { ok: false, error: "status ต้องเป็น Active / Inactive / Vacant" },
        { status: 400 }
      );
    }

    const before = await prisma.assignment.findUnique({
      where: { id },
      select: { status: true, softwareId: true },
    });
    if (!before) {
      return NextResponse.json({ ok: false, error: "ไม่พบ Assignment" }, { status: 404 });
    }

    const data: any = {};
    if (status) {
      data.status = status;
      if (status === "Inactive" && !body.keepAssignedAt) {
        data.releasedAt = new Date();
      } else if (status === "Active") {
        data.releasedAt = null;
      }
    }
    if (body.duration !== undefined) data.duration = body.duration || null;
    if (body.notes !== undefined) data.notes = body.notes || null;

    const updated = await prisma.assignment.update({
      where: { id },
      data,
    });

    // audit log
    if (status && status !== before.status) {
      const username = await getCurrentUser();
      await prisma.auditLog.create({
        data: {
          entityType: "assignment",
          entityId: id,
          action: "update",
          field: "status",
          valueBefore: JSON.stringify(before.status),
          valueAfter: JSON.stringify(status),
          changedBy: username,
        },
      });
    }

    return NextResponse.json({ ok: true, assignment: updated });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// DELETE /api/assignments/[id] — ลบ assignment ออก (เช่นถ้าคนลาออก)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ ok: false, error: "Invalid id" }, { status: 400 });
    }

    const before = await prisma.assignment.findUnique({
      where: { id },
      select: { status: true, userId: true, displayName: true },
    });
    if (!before) {
      return NextResponse.json({ ok: false, error: "ไม่พบ Assignment" }, { status: 404 });
    }

    await prisma.assignment.delete({ where: { id } });

    const username = await getCurrentUser();
    await prisma.auditLog.create({
      data: {
        entityType: "assignment",
        entityId: id,
        action: "delete",
        field: null,
        valueBefore: JSON.stringify(before),
        valueAfter: null,
        changedBy: username,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
