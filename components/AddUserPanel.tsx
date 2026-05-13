"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

interface UserOpt {
  id: number;
  nameTh: string | null;
  nameEn: string | null;
  email: string | null;
}

interface Props {
  softwareId: number;
  users: UserOpt[];
  assignedUserIds: number[];
}

export default function AddUserPanel({ softwareId, users, assignedUserIds }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignedSet = new Set(assignedUserIds);
  const filtered = users
    .filter((u) => !assignedSet.has(u.id))
    .filter((u) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        (u.nameTh || "").toLowerCase().includes(s) ||
        (u.nameEn || "").toLowerCase().includes(s) ||
        (u.email || "").toLowerCase().includes(s)
      );
    })
    .slice(0, 30);

  async function handleSubmit() {
    setError(null);
    setSaving(true);
    try {
      const body: any = { status: "Active" };
      if (mode === "existing") {
        if (!selectedUserId) {
          setError("กรุณาเลือกผู้ใช้");
          return;
        }
        body.userId = selectedUserId;
      } else {
        if (!displayName.trim()) {
          setError("กรุณาใส่ชื่อ");
          return;
        }
        body.displayName = displayName.trim();
      }

      const res = await fetch(`/api/softwares/${softwareId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!j.ok) {
        setError(j.error || "เพิ่มไม่สำเร็จ");
        return;
      }
      setOpen(false);
      setSelectedUserId(null);
      setDisplayName("");
      setSearch("");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
      >
        <Plus className="w-4 h-4" /> เพิ่มผู้ใช้
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 text-lg">เพิ่มผู้ใช้</h3>
          <button onClick={() => setOpen(false)}>
            <X className="w-5 h-5 text-slate-500 hover:text-slate-800" />
          </button>
        </div>

        <div className="flex border-b border-slate-200 mb-4">
          <button
            onClick={() => setMode("existing")}
            className={`flex-1 pb-2 text-sm font-medium ${
              mode === "existing"
                ? "border-b-2 border-blue-600 text-blue-700"
                : "text-slate-500"
            }`}
          >
            เลือกจากผู้ใช้ที่มีอยู่
          </button>
          <button
            onClick={() => setMode("new")}
            className={`flex-1 pb-2 text-sm font-medium ${
              mode === "new"
                ? "border-b-2 border-blue-600 text-blue-700"
                : "text-slate-500"
            }`}
          >
            กรอกชื่อใหม่
          </button>
        </div>

        {mode === "existing" ? (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="ค้นหา ชื่อ / Email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              autoFocus
            />
            <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-md">
              {filtered.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-slate-500">
                  {search ? "ไม่พบผู้ใช้ที่ตรงกับคำค้นหา" : "ไม่มีผู้ใช้ที่ว่าง"}
                </div>
              ) : (
                filtered.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUserId(u.id)}
                    className={`w-full text-left px-3 py-2 text-sm border-b border-slate-100 last:border-0 hover:bg-slate-50 ${
                      selectedUserId === u.id ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="font-medium text-slate-900">
                      {u.nameTh || u.nameEn || "-"}
                    </div>
                    {u.email && (
                      <div className="text-xs text-slate-500">{u.email}</div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              ชื่อ Display
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="เช่น Design Mecthirteen หรือ ว่าง"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              autoFocus
            />
            <p className="text-xs text-slate-400 mt-1">
              สำหรับชื่อชั่วคราว / ที่นั่งว่าง — ไม่ผูกกับ User ในระบบ
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-3 py-2 mt-3">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 py-2 border border-slate-300 rounded-md text-sm hover:bg-slate-50"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md text-sm font-medium disabled:opacity-50"
          >
            {saving ? "กำลังเพิ่ม..." : "เพิ่ม"}
          </button>
        </div>
      </div>
    </div>
  );
}
