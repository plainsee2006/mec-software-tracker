/**
 * ระบบแจ้งเตือน — Email + LINE
 * รองรับ Provider หลายตัว เลือกผ่าน ENV
 */

import { formatDate, formatTHB, daysUntil } from "./utils";

export interface ExpiringSoftware {
  id: number;
  name: string;
  vendor?: string | null;
  expDate: Date | null;
  licenseCount: number;
  totalPrice?: number | null;
}

// ====================================================================
// EMAIL
// ====================================================================
export async function sendEmail(opts: {
  to: string[];
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  const provider = (process.env.EMAIL_PROVIDER || "resend").toLowerCase();

  if (opts.to.length === 0) return { ok: false, error: "ไม่มีผู้รับ" };

  try {
    if (provider === "resend") {
      return await sendViaResend(opts);
    } else if (provider === "smtp") {
      return await sendViaSMTP(opts);
    }
    return { ok: false, error: `ไม่รองรับ provider: ${provider}` };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

async function sendViaResend(opts: { to: string[]; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "noreply@example.com";
  if (!apiKey) return { ok: false, error: "ยังไม่ได้ตั้งค่า RESEND_API_KEY" };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, error: `Resend ${res.status}: ${text}` };
  }
  return { ok: true };
}

async function sendViaSMTP(opts: { to: string[]; subject: string; html: string }) {
  // dynamic import เพื่อไม่ให้ bundle เข้า client
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: opts.to.join(","),
    subject: opts.subject,
    html: opts.html,
  });
  return { ok: true };
}

// ====================================================================
// LINE
// ====================================================================
export async function sendLine(message: string): Promise<{ ok: boolean; error?: string }> {
  // ลองใช้ LINE Messaging API ก่อน (แนะนำ — Notify หยุดให้บริการแล้ว)
  if (process.env.LINE_CHANNEL_ACCESS_TOKEN && process.env.LINE_TARGET_IDS) {
    return sendViaLineMessagingAPI(message);
  }
  if (process.env.LINE_NOTIFY_TOKEN) {
    return sendViaLineNotify(message);
  }
  return { ok: false, error: "ยังไม่ได้ตั้งค่า LINE Token" };
}

async function sendViaLineMessagingAPI(message: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN!;
  const targets = (process.env.LINE_TARGET_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (targets.length === 0) return { ok: false, error: "LINE_TARGET_IDS ว่าง" };

  const errors: string[] = [];
  for (const target of targets) {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: target,
        messages: [{ type: "text", text: message }],
      }),
    });
    if (!res.ok) {
      errors.push(`${target}: ${await res.text()}`);
    }
  }
  if (errors.length > 0) return { ok: false, error: errors.join("; ") };
  return { ok: true };
}

async function sendViaLineNotify(message: string) {
  const token = process.env.LINE_NOTIFY_TOKEN!;
  const params = new URLSearchParams({ message });
  const res = await fetch("https://notify-api.line.me/api/notify", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
  if (!res.ok) {
    return { ok: false, error: `LINE Notify ${res.status}: ${await res.text()}` };
  }
  return { ok: true };
}

// ====================================================================
// MESSAGE BUILDERS
// ====================================================================
export function buildExpiryEmailHtml(items: ExpiringSoftware[], daysBefore: number): string {
  const rows = items
    .map((s) => {
      const days = daysUntil(s.expDate);
      return `<tr>
        <td style="padding:8px;border:1px solid #e5e7eb">${escapeHtml(s.name)}</td>
        <td style="padding:8px;border:1px solid #e5e7eb">${escapeHtml(s.vendor || "-")}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;text-align:center">${s.licenseCount}</td>
        <td style="padding:8px;border:1px solid #e5e7eb">${formatDate(s.expDate)}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;color:${days !== null && days <= 7 ? "#dc2626" : "#d97706"};font-weight:600">${days ?? "-"} วัน</td>
        <td style="padding:8px;border:1px solid #e5e7eb;text-align:right">${formatTHB(s.totalPrice ?? null)}</td>
      </tr>`;
    })
    .join("");

  return `
<!DOCTYPE html>
<html lang="th">
<body style="font-family:'Sarabun',Arial,sans-serif;background:#f9fafb;padding:24px">
  <div style="max-width:760px;margin:auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08)">
    <div style="background:#1d4ed8;color:#fff;padding:20px 24px">
      <h2 style="margin:0;font-size:20px">⏰ แจ้งเตือน Software ใกล้หมดอายุ</h2>
      <p style="margin:6px 0 0;opacity:.9;font-size:13px">เหลือเวลาอีก ${daysBefore} วันก่อนหมดอายุ — กรุณาเตรียมการต่ออายุ</p>
    </div>
    <div style="padding:24px">
      <p style="margin-top:0">รายการ Software ที่จะหมดอายุภายใน <b>${daysBefore} วัน</b> (รวม ${items.length} รายการ)</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <thead style="background:#f3f4f6">
          <tr>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Software</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Vendor</th>
            <th style="padding:8px;border:1px solid #e5e7eb">Licenses</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">วันหมดอายุ</th>
            <th style="padding:8px;border:1px solid #e5e7eb">เหลือ</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:right">ราคารวม</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin-top:24px;color:#6b7280;font-size:12px">ส่งโดยอัตโนมัติจากระบบ MEC Software Tracker</p>
    </div>
  </div>
</body>
</html>`;
}

export function buildExpiryLineMessage(items: ExpiringSoftware[], daysBefore: number): string {
  const lines = items
    .slice(0, 10)
    .map((s, i) => {
      const days = daysUntil(s.expDate);
      return `${i + 1}. ${s.name} (${s.vendor || "-"})\n   หมด: ${formatDate(s.expDate)} • เหลือ ${days ?? "-"} วัน`;
    })
    .join("\n");

  const more = items.length > 10 ? `\n…และอีก ${items.length - 10} รายการ` : "";

  return `⏰ Software ใกล้หมดอายุ (≤ ${daysBefore} วัน)\nรวม ${items.length} รายการ\n\n${lines}${more}`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}
