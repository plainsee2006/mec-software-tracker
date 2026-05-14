"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
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

  const statusBtn = isActive
    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
    : "bg-red-500 hover:bg-red-600 text-white";

  return (
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
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="inline-flex items-center justify-center px-4 py-1.5 rounded text-xs font-semibold bg-red-500 hover:bg-red-600 text-white transition disabled:opacity-50 min-w-[88px]"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}
