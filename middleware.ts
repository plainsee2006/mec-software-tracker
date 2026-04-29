import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifyToken } from "@/lib/auth";

// path ที่ไม่ต้อง login
const PUBLIC_PATHS = [
  "/login",
  "/api/admin-auth/login",
  "/api/admin-auth/logout",
  "/api/cron",            // Vercel cron — มี CRON_SECRET คุ้มกันเอง
];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  const secret = process.env.AUTH_SECRET || "";
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const result = await verifyToken(token, secret);

  if (result.valid) return NextResponse.next();

  // ยังไม่ login → redirect ไป /login (พร้อม redirect param)
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  if (pathname !== "/") url.searchParams.set("redirect", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * จับทุก path ยกเว้น:
     *  - _next/static, _next/image (assets)
     *  - favicon.ico, robots.txt
     *  - ไฟล์ที่มีนามสกุล (รูป, css, js)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\..*).*)",
  ],
};
