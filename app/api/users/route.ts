import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const users = await prisma.user.findMany({ orderBy: { nameEn: "asc" } });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.nameTh && !body.nameEn) {
      return NextResponse.json({ error: "ต้องมีชื่ออย่างน้อยหนึ่งช่อง" }, { status: 400 });
    }
    const created = await prisma.user.create({ data: body });
    return NextResponse.json(created);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
