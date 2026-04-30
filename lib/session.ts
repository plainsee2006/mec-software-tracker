/**
 * Server-side helper สำหรับอ่าน session จาก cookie ใน API route
 */
import { cookies } from "next/headers";
import { COOKIE_NAME, verifyToken } from "./auth";

export async function getCurrentUser(): Promise<string | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  const result = await verifyToken(token, process.env.AUTH_SECRET || "");
  return result.valid ? result.username || null : null;
}
