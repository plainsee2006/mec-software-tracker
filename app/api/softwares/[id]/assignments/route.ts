import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

// POST /api/softwares/[id]/assignments — เพิ่มผู้ใช้เข้า license
//
// Body:
//   { userId?: number, displayName?: string, status?: string, duration?: string }
//   ต้องส่ง userId หรือ displayName อย่างน้อย 1
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const softwareId = parseInt(params.id, 10);
    if (isNaN(softwareId)) {
      return NextResponse.json({ ok: false, error: "Invalid id" }, { status: 400 });
    }
    const body = await req.json();
    const userId = body.userId ? Number(body.userId) : null;
    const displayName: string | null = body.displayName || null;
    const status: string = body.status || "Active";
    const duration: string | null = body.duration || null;

    if (!userId && !displayName) {
      return NextResponse.json(
        { ok: false, error: "ต้องระบุ userId หรือ displayName" },
        { status: 400 }
      );
    }

    // ป้องกัน assign ซ้ำ — ถ้า userId นี้มี assignment ใน software นี้แล้ว → return existing
    if (userId) {
      const existing = await prisma.assignment.findFirst({
        where: { softwareId, userId },
      });
      if (existing) {
        return NextResponse.json(
          { ok: false, error: "ผู้ใช้นี้ถูก assign กับ license นี้อยู่แล้ว" },
          { status: 409 }
        );
      }
    }

    const assignment = await prisma.assignment.create({
      data: {
        softwareId,
        userId,
        displayName: userId ? null : displayName,
        status,
        duration,
      },
    });

    const username = await getCurrentUser();
    await prisma.auditLog.create({
      data: {
        entityType: "assignment",
        entityId: assignment.id,
        action: "create",
        field: null,
        valueBefore: null,
        valueAfter: JSON.stringify({ softwareId, userId, displayName, status }),
        changedBy: username,
      },
    });

    return NextResponse.json({ ok: true, assignment });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
