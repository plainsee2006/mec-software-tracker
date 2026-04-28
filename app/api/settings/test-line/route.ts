import { NextResponse } from "next/server";
import { sendLine } from "@/lib/notifications";

export async function POST() {
  const result = await sendLine(
    `🔔 ทดสอบ MEC Software Tracker\nเวลา: ${new Date().toLocaleString("th-TH")}\n\nหากเห็นข้อความนี้ แสดงว่าระบบ LINE พร้อมใช้งาน ✅`
  );
  return NextResponse.json(result);
}
