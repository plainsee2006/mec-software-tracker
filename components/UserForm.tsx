"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function UserForm({ initial }: { initial?: any }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(initial?.id);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const payload: any = { ...data };
    Object.keys(payload).forEach((k) => {
      if (payload[k] === "") payload[k] = null;
    });

    startTransition(async () => {
      const url = isEdit ? `/api/users/${initial.id}` : "/api/users";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "บันทึกไม่สำเร็จ");
        return;
      }
      router.push(`/users/${json.id || initial.id}`);
      router.refresh();
    });
  }

  async function handleDelete() {
    if (!confirm("ลบผู้ใช้นี้ใช่ไหม? Assignments จะถูกตั้งเป็น Vacant")) return;
    const res = await fetch(`/api/users/${initial.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/users");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm">
          {error}
        </div>
      )}
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-4">ข้อมูลผู้ใช้</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="ชื่อ-นามสกุล (TH)" name="nameTh" defaultValue={initial?.nameTh} />
          <Field label="Display Name (EN)" name="nameEn" defaultValue={initial?.nameEn} />
          <Field label="Email" name="email" type="email" defaultValue={initial?.email} />
          <Field label="Account Email" name="accountEmail" defaultValue={initial?.accountEmail} />
          <Field label="เบอร์โทร" name="phone" defaultValue={initial?.phone} />
          <Field label="ตำแหน่ง" name="position" defaultValue={initial?.position} />
          <Field label="ฝ่าย" name="department" defaultValue={initial?.department} />
          <Field label="สำนักงาน/โครงการ" name="office" defaultValue={initial?.office} />
        </div>
        <div className="mt-4">
          <Field label="หมายเหตุ" name="remarks" type="textarea" defaultValue={initial?.remarks} />
        </div>
      </div>

      <div className="flex justify-between">
        {isEdit && (
          <button type="button" onClick={handleDelete} className="text-red-600 hover:text-red-800 text-sm">
            ลบผู้ใช้
          </button>
        )}
        <div className="flex gap-2 ml-auto">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-slate-300 rounded-md text-sm hover:bg-slate-50">
            ยกเลิก
          </button>
          <button type="submit" disabled={pending} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md text-sm font-medium disabled:opacity-50">
            {pending ? "กำลังบันทึก..." : isEdit ? "บันทึก" : "สร้าง"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Field({ label, name, type = "text", defaultValue }: any) {
  return (
    <div className={type === "textarea" ? "col-span-full" : ""}>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {type === "textarea" ? (
        <textarea
          name={name}
          defaultValue={defaultValue ?? ""}
          rows={3}
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
        />
      ) : (
        <input
          type={type}
          name={name}
          defaultValue={defaultValue ?? ""}
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
        />
      )}
    </div>
  );
}
