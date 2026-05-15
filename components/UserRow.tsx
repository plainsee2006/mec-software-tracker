"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Pencil, X } from "lucide-react";
import Badge from "./Badge";

interface Props {
  index: number;
  id: number;
  nameTh: string | null;
  nameEn: string | null;
  email: string | null;
  position: string | null;
  department: string | null;
  office: string | null;
  active: boolean;
  licenseCount: number;
}

export default function UserRow({
  index, id, nameTh, nameEn, email, position, department, office, active, licenseCount,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [isActive, setIsActive] = useState(active);
  const [editOpen, setEditOpen] = useState(false);

  // edit state
  const [eNameTh, setENameTh] = useState(nameTh ?? "");
  const [eNameEn, setENameEn] = useState(nameEn ?? "");
  const [eEmail, setEEmail] = useState(email ?? "");
  const [ePosition, setEPosition] = useState(position ?? department ?? "");
  const [eOffice, setEOffice] = useState(office ?? "");
  const [eError, setEError] = useState<string | null>(null);

  async function toggleActive() {
    setPending(true);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !isActive }),
      });
      if (res.ok) {
        setIsActive(!isActive);
        router.refresh();
      } else {
        const j = await res.json();
        alert(`ไม่สำเร็จ: ${j.error}`);
      }
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`ลบผู้ใช้ "${nameTh || nameEn}" ใช่ไหม?\n\nหมายเหตุ: จะลบ Assignments ของผู้ใช้นี้ทั้งหมดด้วย`)) return;
    setPending(true);
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        const j = await res.json();
        alert(`ลบไม่สำเร็จ: ${j.error}`);
      }
    } finally {
      setPending(false);
    }
  }

  async function handleSaveEdit() {
    setEError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameTh: eNameTh || null,
          nameEn: eNameEn || null,
          email: eEmail || null,
          position: ePosition || null,
          office: eOffice || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        setEError(j.error || "บันทึกไม่สำเร็จ");
        return;
      }
      setEditOpen(false);
      router.refresh();
    } catch (err: any) {
      setEError(err.message);
    } finally {
      setPending(false);
    }
  }

  const statusBtn = isActive
    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
    : "bg-red-500 hover:bg-red-600 text-white";

  return (
    <>
      <tr className={`border-t border-slate-100 hover:bg-slate-50 ${!isActive ? "opacity-70" : ""}`}>
        <td className="px-4 py-2.5 text-center text-slate-500 text-sm">{index + 1}</td>
        <td className="px-4 py-2.5">
          <Link href={`/users/${id}`} className="font-medium hover:text-blue-600">
            {nameTh || nameEn || "-"}
          </Link>
          {nameEn && nameTh && (
            <div className="text-xs text-slate-500">{nameEn}</div>
          )}
        </td>
        <td className="px-4 py-2.5 text-slate-600">{email || "-"}</td>
        <td className="px-4 py-2.5 text-slate-600">{position || department || "-"}</td>
        <td className="px-4 py-2.5 text-slate-600">{office || "-"}</td>
        <td className="px-4 py-2.5 text-center">
          <Badge className="bg-blue-100 text-blue-800">{licenseCount}</Badge>
        </td>
        <td className="px-4 py-2.5">
          <button
            type="button"
            onClick={toggleActive}
            disabled={pending}
            className={`inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded text-xs font-semibold transition disabled:opacity-50 min-w-[88px] ${statusBtn}`}
            title="คลิกเพื่อสลับสถานะ"
          >
            {pending && <Loader2 className="w-3 h-3 animate-spin" />}
            {isActive ? "Active" : "Inactive"}
          </button>
        </td>
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              disabled={pending}
              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white transition disabled:opacity-50"
              title="แก้ไขข้อมูลผู้ใช้"
            >
              <Pencil className="w-3 h-3" /> Edit
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              className="inline-flex items-center justify-center px-3 py-1.5 rounded text-xs font-semibold bg-red-500 hover:bg-red-600 text-white transition disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </td>
      </tr>

      {editOpen && (
        <tr>
          <td colSpan={8} className="p-0">
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900 text-lg">แก้ไขข้อมูลผู้ใช้</h3>
                  <button onClick={() => setEditOpen(false)}>
                    <X className="w-5 h-5 text-slate-500 hover:text-slate-800" />
                  </button>
                </div>

                <div className="space-y-3">
                  <Field label="ชื่อ (ไทย)">
                    <input value={eNameTh} onChange={(e) => setENameTh(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                  </Field>
                  <Field label="ชื่อ (อังกฤษ)">
                    <input value={eNameEn} onChange={(e) => setENameEn(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                  </Field>
                  <Field label="Email">
                    <input type="email" value={eEmail} onChange={(e) => setEEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                  </Field>
                  <Field label="แผนก / ฝ่าย">
                    <input value={ePosition} onChange={(e) => setEPosition(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                  </Field>
                  <Field label="Project / สำนักงาน">
                    <input value={eOffice} onChange={(e) => setEOffice(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                  </Field>
                </div>

                {eError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-3 py-2 mt-3">
                    {eError}
                  </div>
                )}

                <div className="flex justify-end gap-2 mt-5">
                  <button type="button" onClick={() => setEditOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded-md text-sm hover:bg-slate-50">
                    ยกเลิก
                  </button>
                  <button type="button" onClick={handleSaveEdit} disabled={pending}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md text-sm font-medium disabled:opacity-50">
                    {pending ? "กำลังบันทึก..." : "บันทึก"}
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
