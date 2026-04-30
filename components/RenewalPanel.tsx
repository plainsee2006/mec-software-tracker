"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Calendar } from "lucide-react";

type Renewal = {
  id: number;
  renewalDate: string;
  expDateBefore: string | null;
  expDateAfter: string;
  amountPaid: number | null;
  vendor: string | null;
  notes: string | null;
  createdBy: string | null;
};

interface Props {
  softwareId: number;
  renewals: Renewal[];
  currentExpDate: string | null;
}

function formatDmy(d: string | null): string {
  if (!d) return "-";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "-";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${date.getFullYear()}`;
}
function formatTHB(n: number | null): string {
  if (n === null || n === undefined) return "-";
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(n);
}
function isoToDmy(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}
function dmyToIso(dmy: string): string {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(dmy.trim());
  if (!m) return "";
  const dd = m[1].padStart(2, "0");
  const mm = m[2].padStart(2, "0");
  return `${m[3]}-${mm}-${dd}`;
}

export default function RenewalPanel({ softwareId, renewals, currentExpDate }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [renewalDate, setRenewalDate] = useState(formatDmy(new Date().toISOString()));
  const [expDateAfter, setExpDateAfter] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [vendor, setVendor] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function maskDmy(s: string): string {
    const raw = s.replace(/\D/g, "").slice(0, 8);
    if (raw.length >= 5) return `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4)}`;
    if (raw.length >= 3) return `${raw.slice(0, 2)}/${raw.slice(2)}`;
    return raw;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const renewalIso = dmyToIso(renewalDate);
    const expIso = dmyToIso(expDateAfter);
    if (!renewalIso) { setError("วันที่ต่อสัญญาไม่ถูกต้อง — รูปแบบ dd/mm/yyyy"); return; }
    if (!expIso) { setError("วันหมดอายุใหม่ไม่ถูกต้อง — รูปแบบ dd/mm/yyyy"); return; }

    setSaving(true);
    try {
      const res = await fetch(`/api/softwares/${softwareId}/renewals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          renewalDate: renewalIso,
          expDateAfter: expIso,
          amountPaid: amountPaid ? Number(amountPaid) : null,
          vendor: vendor || null,
          notes: notes || null,
        }),
      });
      const j = await res.json();
      if (!j.ok) {
        setError(j.error || "บันทึกไม่สำเร็จ");
        return;
      }
      setOpen(false);
      setExpDateAfter("");
      setAmountPaid("");
      setVendor("");
      setNotes("");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">ประวัติการต่อสัญญา</h2>
          <p className="text-xs text-slate-500 mt-0.5">{renewals.length} ครั้ง</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> บันทึกการต่ออายุ
        </button>
      </div>

      {/* Timeline */}
      {renewals.length === 0 ? (
        <div className="px-5 py-12 text-center text-slate-500 text-sm">
          ยังไม่มีประวัติการต่อสัญญา — กดปุ่ม "บันทึกการต่ออายุ" เพื่อเพิ่มรายการแรก
        </div>
      ) : (
        <ol className="divide-y divide-slate-100">
          {renewals.map((r) => (
            <li key={r.id} className="px-5 py-4 hover:bg-slate-50">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">
                      ต่อสัญญาเมื่อ {formatDmy(r.renewalDate)}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      หมดเดิม {formatDmy(r.expDateBefore)} → หมดใหม่ {formatDmy(r.expDateAfter)}
                      {r.vendor && ` · ผ่าน ${r.vendor}`}
                    </div>
                    {r.notes && (
                      <div className="text-xs text-slate-600 mt-1 italic">{r.notes}</div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-slate-900">{formatTHB(r.amountPaid)}</div>
                  <div className="text-xs text-slate-400">{r.createdBy || ""}</div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="font-semibold text-slate-900 text-lg mb-4">บันทึกการต่ออายุ</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Field label="วันที่ต่อสัญญา *">
                <input
                  type="text"
                  value={renewalDate}
                  onChange={(e) => setRenewalDate(maskDmy(e.target.value))}
                  placeholder="dd/mm/yyyy"
                  required
                  maxLength={10}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </Field>
              <Field label="วันหมดอายุใหม่ *">
                <input
                  type="text"
                  value={expDateAfter}
                  onChange={(e) => setExpDateAfter(maskDmy(e.target.value))}
                  placeholder="dd/mm/yyyy"
                  required
                  maxLength={10}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
                <div className="text-xs text-slate-400 mt-1">
                  หมดเดิม: {formatDmy(currentExpDate)}
                </div>
              </Field>
              <Field label="ราคาที่จ่าย (บาท)">
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="เช่น 280000"
                  step="any"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </Field>
              <Field label="Vendor (ที่ต่อกับ)">
                <input
                  type="text"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  placeholder="เช่น VR, Netcube"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </Field>
              <Field label="หมายเหตุ">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </Field>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-3 py-2">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-md text-sm hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {saving ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
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
