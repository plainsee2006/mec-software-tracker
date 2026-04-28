/**
 * Cron endpoint — เช็ค Software ใกล้หมดอายุและส่งแจ้งเตือน
 * Schedule: ทุกวัน 08:00 (ตาม vercel.json)
 *
 * Auth: Vercel cron จะส่ง header `Authorization: Bearer <CRON_SECRET>`
 * ดู https://vercel.com/docs/cron-jobs#securing-cron-jobs
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { daysUntil, NOTIFICATION_DAYS } from "@/lib/utils";
import {
  sendEmail,
  sendLine,
  buildExpiryEmailHtml,
  buildExpiryLineMessage,
  type ExpiringSoftware,
} from "@/lib/notifications";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // ตรวจสอบ Vercel Cron Auth
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runExpiryCheck();
  return NextResponse.json(result);
}

// Allow manual trigger via POST too
export async function POST(req: NextRequest) {
  return GET(req);
}

async function runExpiryCheck() {
  const allSoftwares = await prisma.software.findMany({
    where: { expDate: { not: null } },
    include: { vendor: true },
  });

  const summary: Record<number, { items: ExpiringSoftware[]; alreadyNotified: Set<string> }> = {};
  for (const t of NOTIFICATION_DAYS) summary[t] = { items: [], alreadyNotified: new Set() };

  // หา Software ที่ตกใน threshold
  for (const sw of allSoftwares) {
    const days = daysUntil(sw.expDate);
    if (days === null) continue;

    // เลือก threshold ที่ใกล้ที่สุดที่ตก
    let bucket: number | null = null;
    for (const t of NOTIFICATION_DAYS) {
      if (days <= t && days >= 0) {
        bucket = t;
        break;
      }
    }
    if (bucket === null) continue;

    summary[bucket].items.push({
      id: sw.id,
      name: sw.name,
      vendor: sw.vendor?.name,
      expDate: sw.expDate,
      licenseCount: sw.licenseCount,
      totalPrice: sw.totalPrice,
    });
  }

  // โหลด log เพื่อกรอง Software ที่แจ้งไปแล้ว
  const channels = ["email", "line"] as const;
  const sentResults: any[] = [];

  for (const days of NOTIFICATION_DAYS) {
    const items = summary[days].items;
    if (items.length === 0) continue;

    for (const channel of channels) {
      // ตรวจสอบ Software ใดยังไม่ถูกแจ้งใน threshold + channel นี้
      const alreadySent = await prisma.notificationLog.findMany({
        where: {
          softwareId: { in: items.map((i) => i.id) },
          daysBefore: days,
          channel,
        },
      });
      const sentIds = new Set(alreadySent.map((l) => l.softwareId));
      const newItems = items.filter((i) => !sentIds.has(i.id));
      if (newItems.length === 0) continue;

      let sendResult: { ok: boolean; error?: string };
      if (channel === "email") {
        const recipients = (process.env.ALERT_EMAILS || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (recipients.length === 0) {
          sendResult = { ok: false, error: "ALERT_EMAILS ว่าง" };
        } else {
          sendResult = await sendEmail({
            to: recipients,
            subject: `[MEC Software] ⏰ ${newItems.length} รายการใกล้หมดอายุ ≤ ${days} วัน`,
            html: buildExpiryEmailHtml(newItems, days),
          });
        }
      } else {
        sendResult = await sendLine(buildExpiryLineMessage(newItems, days));
      }

      // บันทึก log สำหรับทุก software ที่อยู่ใน batch นี้
      for (const item of newItems) {
        try {
          await prisma.notificationLog.create({
            data: {
              softwareId: item.id,
              daysBefore: days,
              channel,
              status: sendResult.ok ? "sent" : "failed",
              message: sendResult.error || null,
            },
          });
        } catch {
          // unique constraint conflict — ignore
        }
      }

      sentResults.push({
        threshold: days,
        channel,
        count: newItems.length,
        ok: sendResult.ok,
        error: sendResult.error,
      });
    }
  }

  return {
    ok: true,
    timestamp: new Date().toISOString(),
    checked: allSoftwares.length,
    notifications: sentResults,
  };
}
