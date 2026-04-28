"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface VendorOpt { id: number; name: string; }
interface CategoryOpt { id: number; name: string; }

interface Props {
  initial?: any;
  vendors: VendorOpt[];
  categories: CategoryOpt[];
}

export default function SoftwareForm({ initial, vendors, categories }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(initial?.id);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = Object.fromEntries(new FormData(e.currentTarget));

    const payload: any = {
      name: data.name,
      owner: data.owner || null,
      description: data.description || null,
      licenseCount: Number(data.licenseCount || 1),
      pricePerUnit: data.pricePerUnit ? Number(data.pricePerUnit) : null,
      totalPrice: data.totalPrice ? Number(data.totalPrice) : null,
      monthlyPrice: data.monthlyPrice ? Number(data.monthlyPrice) : null,
      expDate: data.expDate || null,
      vendorId: data.vendorId ? Number(data.vendorId) : null,
      categoryId: data.categoryId ? Number(data.categoryId) : null,
      vendorNew: data.vendorNew || null,
      categoryNew: data.categoryNew || null,
      notes: data.notes || null,
    };

    startTransition(async () => {
      const url = isEdit ? `/api/softwares/${initial.id}` : "/api/softwares";
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
      router.push(`/softwares/${json.id || initial.id}`);
      router.refresh();
    });
  }

  async function handleDelete() {
    if (!isEdit) return;
    if (!confirm("ลบรายการนี้ใช่ไหม?")) return;
    const res = await fetch(`/api/softwares/${initial.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/softwares");
      router.refresh();
    }
  }

  const expDateValue = initial?.expDate
    ? new Date(initial.expDate).toISOString().slice(0, 10)
    : "";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
        <h3 className="font-semibold text-slate-900">ข้อมูลพื้นฐาน</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="ชื่อ Software *" name="name" defaultValue={initial?.name} required />
          <Field label="Brand / Owner" name="owner" defaultValue={initial?.owner} placeholder="เช่น Adobe, Autodesk" />
          <SelectWithCreate
            label="Vendor (ผู้จำหน่าย)"
            name="vendorId"
            createName="vendorNew"
            options={vendors}
            defaultValue={initial?.vendorId}
          />
          <SelectWithCreate
            label="หมวดหมู่"
            name="categoryId"
            createName="categoryNew"
            options={categories}
            defaultValue={initial?.categoryId}
          />
        </div>
        <Field label="คำอธิบาย" name="description" type="textarea" defaultValue={initial?.description} />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
        <h3 className="font-semibold text-slate-900">License & ราคา</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field label="จำนวน License *" name="licenseCount" type="number" defaultValue={initial?.licenseCount ?? 1} required />
          <Field label="ราคา/Unit (บาท)" name="pricePerUnit" type="number" defaultValue={initial?.pricePerUnit} />
          <Field label="ราคารวม (บาท)" name="totalPrice" type="number" defaultValue={initial?.totalPrice} />
          <Field label="ราคา/เดือน (บาท)" name="monthlyPrice" type="number" defaultValue={initial?.monthlyPrice} />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
        <h3 className="font-semibold text-slate-900">วันหมดอายุ & หมายเหตุ</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="วันหมดอายุ" name="expDate" type="date" defaultValue={expDateValue} />
        </div>
        <Field label="หมายเหตุ" name="notes" type="textarea" defaultValue={initial?.notes} />
      </div>

      <div className="flex justify-between items-center">
        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            ลบรายการนี้
          </button>
        )}
        <div className="flex gap-2 ml-auto">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-slate-300 rounded-md text-sm hover:bg-slate-50"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={pending}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md text-sm font-medium disabled:opacity-50"
          >
            {pending ? "กำลังบันทึก..." : isEdit ? "บันทึก" : "สร้าง"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: any;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className={type === "textarea" ? "col-span-full" : ""}>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}
      </label>
      {type === "textarea" ? (
        <textarea
          name={name}
          defaultValue={defaultValue ?? ""}
          rows={3}
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder={placeholder}
        />
      ) : (
        <input
          type={type}
          name={name}
          defaultValue={defaultValue ?? ""}
          required={required}
          placeholder={placeholder}
          step={type === "number" ? "any" : undefined}
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
      )}
    </div>
  );
}

function SelectWithCreate({
  label,
  name,
  createName,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  createName: string;
  options: { id: number; name: string }[];
  defaultValue?: number;
}) {
  const [creating, setCreating] = useState(false);
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {creating ? (
        <div className="flex gap-2">
          <input
            type="text"
            name={createName}
            placeholder="พิมพ์ชื่อใหม่"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
          />
          <button
            type="button"
            onClick={() => setCreating(false)}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            ยกเลิก
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <select
            name={name}
            defaultValue={defaultValue ?? ""}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            <option value="">— เลือก —</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="text-xs text-blue-600 hover:text-blue-700 whitespace-nowrap"
          >
            + สร้างใหม่
          </button>
        </div>
      )}
    </div>
  );
}
