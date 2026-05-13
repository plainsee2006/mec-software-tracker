"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, X, MinusCircle, Trash2, Loader2, ArrowRightLeft } from "lucide-react";
import Badge from "./Badge";

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

export default function AssignmentRow({ index, id, status, displayName, user, moveTargets = [] }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>(status);

  async function changeStatus(newStatus: Status) {
    setPending(true);
    setOpen(false);
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
        alert(`failed: ${j.error}`);
      }
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Remove this assignment from the license?")) return;
    setPending(true);
    setOpen(false);
    try {
      const res = await fetch(`/api/assignments/${id}`, { method: "DELETE" });
      const j = await res.json();
      if (j.ok) {
        router.refresh();
      } else {
        alert(`delete failed: ${j.error}`);
      }
    } finally {
      setPending(false);
    }
  }

  async function moveTo(targetId: number) {
    setPending(true);
    setOpen(false);
    try {
      const res = await fetch(`/api/assignments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ softwareId: targetId }),
      });
      const j = await res.json();
      if (j.ok) {
        router.refresh();
      } else {
        alert(`move failed: ${j.error}`);
      }
    } finally {
      setPending(false);
    }
  }

  const badgeCls =
    currentStatus === "Active"
      ? "bg-emerald-100 text-emerald-800"
      : currentStatus === "Vacant"
      ? "bg-yellow-100 text-yellow-800"
      : "bg-slate-200 text-slate-600";

  return (
    <tr className={`border-t border-slate-100 ${currentStatus === "Inactive" ? "opacity-60" : ""}`}>
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
      <td className="px-4 py-2.5 relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          disabled={pending}
          className="inline-flex items-center gap-1.5 hover:ring-2 hover:ring-blue-400 rounded transition disabled:opacity-50"
          title="Click to change status"
        >
          {pending ? <Loader2 className="w-3 h-3 animate-spin text-slate-400" /> : null}
          <Badge className={badgeCls}>{currentStatus}</Badge>
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute z-20 mt-1 bg-white border border-slate-200 rounded-md shadow-lg py-1 min-w-[140px] right-0">
              <button onClick={() => changeStatus("Active")} className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Active
              </button>
              <button onClick={() => changeStatus("Inactive")} className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 flex items-center gap-2">
                <X className="w-3.5 h-3.5 text-slate-500" /> Inactive
              </button>
              <button onClick={() => changeStatus("Vacant")} className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 flex items-center gap-2">
                <MinusCircle className="w-3.5 h-3.5 text-yellow-600" /> Vacant
              </button>
              {moveTargets.length > 0 && (
                <>
                  <div className="border-t border-slate-100 my-1" />
                  <div className="px-3 py-1 text-xs text-slate-400 flex items-center gap-1.5">
                    <ArrowRightLeft className="w-3 h-3" /> Move to batch
                  </div>
                  {moveTargets.map((t) => (
                    <button key={t.id} onClick={() => moveTo(t.id)} className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 flex items-center gap-2">
                      <span className="text-slate-400">{"->"}</span>
                      <span>
                        {t.name}
                        {t.expDate && (
                          <span className="text-xs text-slate-500 ml-1">
                            ({new Date(t.expDate).toLocaleDateString("en-GB")})
                          </span>
                        )}
                      </span>
                    </button>
                  ))}
                </>
              )}
              <div className="border-t border-slate-100 my-1" />
              <button onClick={handleDelete} className="w-full text-left px-3 py-1.5 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2">
                <Trash2 className="w-3.5 h-3.5" /> Remove
              </button>
            </div>
          </>
        )}
      </td>
    </tr>
  );
}
