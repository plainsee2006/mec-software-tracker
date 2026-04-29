import { NextResponse } from "next/server";
import { COOKIE_NAME, MAX_AGE_MS, signToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = String(body.username || "").trim();
    const password = String(body.password || "");

    const expectedUser = process.env.ADMIN_USERNAME || "";
    const expectedPass = process.env.ADMIN_PASSWORD || "";
    const secret = process.env.AUTH_SECRET || "";

    if (!expectedUser || !expectedPass || !secret) {
      return NextResponse.json(
        { ok: false, error: "ระบบ Auth ยังไม่ได้ตั้งค่า ADMIN_USERNAME/ADMIN_PASSWORD/AUTH_SECRET" },
        { status: 500 }
      );
    }

    if (username !== expectedUser || password !== expectedPass) {
      return NextResponse.json(
        { ok: false, error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    const token = await signToken(username, secret);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(MAX_AGE_MS / 1000),
    });
    return res;
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
