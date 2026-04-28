import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/notifications";

export async function POST() {
  const recipients = (process.env.ALERT_EMAILS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    return NextResponse.json(
      { ok: false, error: "ยังไม่ได้ตั้งค่า ALERT_EMAILS" },
      { status: 400 }
    );
  }

  const result = await sendEmail({
    to: recipients,
    subject: "[MEC Software Tracker] ทดสอบการส่งอีเมล",
    html: `
      <div style="font-family:sans-serif;padding:20px">
        <h2>✅ ระบบ Email พร้อมใช้งาน</h2>
        <p>นี่เป็นอีเมลทดสอบจากระบบ MEC Software Tracker</p>
        <p>เวลา: ${new Date().toLocaleString("th-TH")}</p>
      </div>
    `,
  });

  return NextResponse.json(result);
}
