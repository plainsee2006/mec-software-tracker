"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";

export default function SettingsPage() {
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingLine, setTestingLine] = useState(false);
  const [emailResult, setEmailResult] = useState<string | null>(null);
  const [lineResult, setLineResult] = useState<string | null>(null);

  async function testEmail() {
    setTestingEmail(true);
    setEmailResult(null);
    const res = await fetch("/api/settings/test-email", { method: "POST" });
    const j = await res.json();
    setEmailResult(j.ok ? "✅ ส่งสำเร็จ — ลองเช็ค Inbox" : `❌ ${j.error}`);
    setTestingEmail(false);
  }

  async function testLine() {
    setTestingLine(true);
    setLineResult(null);
    const res = await fetch("/api/settings/test-line", { method: "POST" });
    const j = await res.json();
    setLineResult(j.ok ? "✅ ส่งสำเร็จ — เช็คที่ LINE" : `❌ ${j.error}`);
    setTestingLine(false);
  }

  async function runImport() {
    if (!confirm("Import ข้อมูลจาก Excel เข้าฐานข้อมูล? (จะรวมกับข้อมูลที่มีอยู่)")) return;
    const res = await fetch("/api/import", { method: "POST" });
    const j = await res.json();
    if (j.ok) {
      alert(`Import สำเร็จ!\n• Software: ${j.softwares}\n• Users: ${j.users}\n• Assignments: ${j.assignments}`);
    } else {
      alert(`Import ล้มเหลว: ${j.error}`);
    }
  }

  return (
    <>
      <PageHeader title="ตั้งค่า" description="จัดการระบบและทดสอบการแจ้งเตือน" />
      <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
        {/* Notifications */}
        <Section title="ทดสอบการแจ้งเตือน">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Email</div>
                <div className="text-xs text-slate-500">ส่ง Email ทดสอบไปยัง ALERT_EMAILS</div>
              </div>
              <button
                onClick={testEmail}
                disabled={testingEmail}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
              >
                {testingEmail ? "กำลังส่ง..." : "ทดสอบ"}
              </button>
            </div>
            {emailResult && <div className="text-sm">{emailResult}</div>}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div>
                <div className="font-medium">LINE</div>
                <div className="text-xs text-slate-500">ส่ง LINE ทดสอบไปยัง LINE_TARGET_IDS</div>
              </div>
              <button
                onClick={testLine}
                disabled={testingLine}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
              >
                {testingLine ? "กำลังส่ง..." : "ทดสอบ"}
              </button>
            </div>
            {lineResult && <div className="text-sm">{lineResult}</div>}
          </div>
        </Section>

        {/* Import */}
        <Section title="นำเข้าข้อมูล">
          <p className="text-sm text-slate-600 mb-3">
            Import ข้อมูลจากไฟล์ Excel <code>ข้อมูลโปรแกรมทั้งหมด-07-11-2568.xlsx</code> ที่อยู่ในโฟลเดอร์โปรเจกต์
          </p>
          <button
            onClick={runImport}
            className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-md text-sm"
          >
            เริ่ม Import
          </button>
        </Section>

        {/* Cron */}
        <Section title="ระบบแจ้งเตือนอัตโนมัติ">
          <p className="text-sm text-slate-600">
            ระบบจะเช็คทุกวัน เวลา 08:00 (ตามเวลา UTC ที่ตั้งใน <code>vercel.json</code>) และส่งแจ้งเตือนเมื่อ:
          </p>
          <ul className="list-disc list-inside text-sm text-slate-600 mt-2 space-y-1">
            <li>เหลือ 60 วันก่อนหมดอายุ</li>
            <li>เหลือ 30 วันก่อนหมดอายุ</li>
            <li>เหลือ 7 วันก่อนหมดอายุ</li>
            <li>หมดอายุแล้ว</li>
          </ul>
          <p className="text-xs text-slate-500 mt-3">
            แต่ละรายการจะแจ้งเตือนแค่ 1 ครั้งต่อ Threshold (ป้องกันสแปม)
          </p>
        </Section>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <h2 className="font-semibold text-slate-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}
