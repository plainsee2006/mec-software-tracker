"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Pencil, X } from "lucide-react";

type Status = "Active" | "Inactive" | "Vacant";

interface UserInfo {
  id: number;
  nameTh: string | null;
  nameEn: string | null;
  email: string | null;
  position: string | null;
  department: string | null;
  office: string | null;
}

interface MoveTarget {
  id: number;
  name: string;
  expDate: string | null;
}

interface Props {
  index: number;
  id: number;
  status: string;
  displayName: string | null;
  user: UserInfo | null;
  moveTargets?: MoveTarget[];
}

export default function AssignmentRow({ index, id, status, displayName, user }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>(status);
  const [editOpen, setEditOpen] = useState(false);

  // edit state
  const [eNameTh, setENameTh] = useState(user?.nameTh ?? "");
  const [eNameEn, setENameEn] = useState(user?.nameEn ?? displayName ?? "");
  const [eEmail, setEEmail] = useState(user?.email ?? "");
  const [ePosition, setEPosition] = useState(user?.position ?? user?.department ?? "");
  const [eOffice, setEOffice] = useState(user?.office ?? "");
  const [eDisplay, setEDisplay] = useState(displayName ?? "");
  const [eError, setEError] = useState<string | null>(null);

  async function toggleStatus() {
    const newStatus: Status = currentStatus === "Active" ? "Inactive" : "Active";
    setPending(true);
    try {
      const res = await fetch(`/api/assignments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const j = await res.json();
      if (j.ok) {
        setCurrentStatus(newStatus);
        router.refresh();
      } else {
        alert(`ไม่สำเร็จ: ${j.error}`);
      }
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!confirm("ลบ Assignment นี้ออกจาก license ใช่ไหม?")) return;
    setPending(true);
    try {
      const res = await fetch(`/api/assignments/${id}`, { method: "DELETE" });
      const j = await res.json();
      if (j.ok) {
        router.refresh();
      } else {
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
      if (user) {
        // edit existing user
        const res = await fetch(`/api/users/${user.id}`, {
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
      } else {
        // edit assignment displayName only
        const res = await fetch(`/api/assignments/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: eDisplay || null }),
        });
        const j = await res.json();
        if (!j.ok) {
          setEError(j.error || "บันทึกไม่สำเร็จ");
          return;
        }
      }
      setEditOpen(false);
      router.refresh();
    } catch (err: any) {
      setEError(err.message);
    } finally {
      setPending(false);
    }
  }

  const isActive = currentStatus === "Active";
  const statusBtn = isActive
    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
    : "bg-red-500 hover:bg-red-600 text-white";

  return (
    <>
      <tr className={`border-t border-slate-100 ${!isActive ? "opacity-70" : ""}`}>
        <td className="px-4 py-2.5 text-slate-400">{index + 1}</td>
        <td className="px-4 py-2.5">
          {user ? (
            <Link href={`/users/${user.id}`} className="font-medium hover:text-blue-600">
              {user.nameTh || user.nameEn || "-"}
            </Link>
          ) : (
            <span className="text-slate-400 italic">{displayName || "Vacant"}</span>
          )}
          {user?.nameEn && user.nameTh && (
            <div className="text-xs text-slate-500">{user.nameEn}</div>
          )}
        </td>
        <td className="px-4 py-2.5 text-slate-600">{user?.email || "-"}</td>
        <td className="px-4 py-2.5 text-slate-600">{user?.position || user?.department || "-"}</td>
        <td className="px-4 py-2.5 text-slate-600">{user?.office || "-"}</td>
        <td className="px-4 py-2.5">
          <button
            type="button"
            onClick={toggleStatus}
            disabled={pending}
            className={`inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded text-xs font-semibold transition disabled:opacity-50 min-w-[88px] ${statusBtn}`}
            title="คลิกเพื่อสลับสถานะ"
          >
            {pending && <Loader2 className="w-3 h-3 animate-spin" />}
            {currentStatus}
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
          <td colSpan={7} className="p-0">
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900 text-lg">แก้ไขข้อมูลผู้ใช้</h3>
                  <button onClick={() => setEditOpen(false)}>
                    <X className="w-5 h-5 text-slate-500 hover:text-slate-800" />
                  </button>
                </div>

                {user ? (
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
                    <Field label="ตำแหน่ง / ฝ่าย">
                      <input value={ePosition} onChange={(e) => setEPosition(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                    </Field>
                    <Field label="สำนักงาน / โครงการ">
                      <input value={eOffice} onChange={(e) => setEOffice(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                    </Field>
                  </div>
                ) : (
                  <Field label="ชื่อ Display (ผู้ใช้ชั่วคราว / ที่นั่งว่าง)">
                    <input value={eDisplay} onChange={(e) => setEDisplay(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                  </Field>
                )}

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
