"use client";

import { useRef, useState } from "react";
import PageHeader from "@/components/PageHeader";

export default function SettingsPage() {
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingLine, setTestingLine] = useState(false);
  const [emailResult, setEmailResult] = useState<string | null>(null);
  const [lineResult, setLineResult] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".xlsx")) {
      alert("กรุณาเลือกไฟล์ .xlsx เท่านั้น");
      e.target.value = "";
      return;
    }
    setSelectedFile(f);
    setImportResult(null);
  }

  async function runImport() {
    const useUpload = !!selectedFile;
    const msg = useUpload
      ? `Import ข้อมูลจากไฟล์ "${selectedFile!.name}"?\n\n⚠️ Software/Assignment เก่าจะถูกลบและแทนที่ด้วยข้อมูลจากไฟล์นี้`
      : "Import จากไฟล์ Excel ที่อยู่ในโปรเจค?\n\n⚠️ Software/Assignment เก่าจะถูกลบและแทนที่";
    if (!confirm(msg)) return;

    setImporting(true);
    setImportResult(null);
    try {
      let res: Response;
      if (useUpload) {
        const fd = new FormData();
        fd.append("file", selectedFile!);
        res = await fetch("/api/import", { method: "POST", body: fd });
      } else {
        res = await fetch("/api/import", { method: "POST" });
      }
      const j = await res.json();
      if (j.ok) {
        setImportResult(
          `✅ Import สำเร็จ — Software: ${j.softwares} | Users: ${j.users} | Assignments: ${j.assignments} | Vendors: ${j.vendors} | Categories: ${j.categories}`
        );
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        setImportResult(`❌ ${j.error}`);
      }
    } catch (err) {
      setImportResult(`❌ ${(err as Error).message}`);
    } finally {
      setImporting(false);
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
          <p className="text-sm text-slate-600 mb-4">
            Import ข้อมูลจากไฟล์ Excel — เลือกไฟล์จากเครื่อง หรือใช้ไฟล์เดิมในโปรเจกต์
          </p>

          {/* File picker */}
          <div className="border border-dashed border-slate-300 rounded-md p-4 mb-3 bg-slate-50">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 px-4 py-2 rounded-md text-sm font-medium"
              >
                📁 เลือกไฟล์ Excel
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                className="hidden"
              />
              {selectedFile ? (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-900 font-medium">{selectedFile.name}</span>
                  <span className="text-slate-500 text-xs">
                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="text-red-600 hover:text-red-800 text-xs ml-1"
                  >
                    ลบ
                  </button>
                </div>
              ) : (
                <span className="text-slate-500 text-xs">
                  ยังไม่เลือกไฟล์ — จะใช้ <code className="bg-white px-1 rounded">public/ข้อมูลโปรแกรมทั้งหมด-07-11-2568.xlsx</code>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={runImport}
              disabled={importing}
              className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
            >
              {importing ? "กำลัง Import..." : "เริ่ม Import"}
            </button>
            {importResult && <span className="text-sm">{importResult}</span>}
          </div>

          <p className="text-xs text-slate-500 mt-3">
            ⚠️ หมายเหตุ: การ Import จะลบ Software / Assignment / NotificationLog เดิมและแทนที่ด้วยข้อมูลใหม่ — Vendor, Category, User เก่าจะคงอยู่
          </p>
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
