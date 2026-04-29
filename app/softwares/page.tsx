import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Plus } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Badge from "@/components/Badge";
import {
  formatDate,
  formatTHB,
  daysUntil,
  getExpiryStatus,
  expiryStatusBadgeClass,
  expiryStatusLabel,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SoftwareListPage({
  searchParams,
}: {
  searchParams: { software?: string; status?: string; vendor?: string; license?: string };
}) {
  const filterSoftware = searchParams.software;
  const filterStatus = searchParams.status;
  const filterVendor = searchParams.vendor;
  const filterLicense = searchParams.license; // full | available | unused

  let softwares: any[] = [];
  let vendors: any[] = [];
  let allSoftwareNames: { id: number; name: string }[] = [];
  try {
    [softwares, vendors, allSoftwareNames] = await Promise.all([
      prisma.software.findMany({
        where: {
          AND: [
            filterSoftware ? { name: filterSoftware } : {},
            filterVendor ? { vendor: { name: filterVendor } } : {},
          ],
        },
        include: { vendor: true, category: true, _count: { select: { assignments: true } } },
        orderBy: [{ expDate: "asc" }, { name: "asc" }],
      }),
      prisma.vendor.findMany({ orderBy: { name: "asc" } }),
      prisma.software.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);
  } catch {
    // DB not ready
  }

  const filteredByStatus = filterStatus
    ? softwares.filter((s) => getExpiryStatus(s.expDate) === filterStatus)
    : softwares;

  const filtered = filterLicense
    ? filteredByStatus.filter((s) => {
        const used = s._count.assignments;
        const total = s.licenseCount;
        if (filterLicense === "full") return used >= total && total > 0;
        if (filterLicense === "available") return used > 0 && used < total;
        if (filterLicense === "unused") return used === 0;
        return true;
      })
    : filteredByStatus;

  // unique software names for dropdown
  const softwareNameSet = new Set<string>();
  const uniqueSoftwareNames: string[] = [];
  for (const s of allSoftwareNames) {
    if (!softwareNameSet.has(s.name)) {
      softwareNameSet.add(s.name);
      uniqueSoftwareNames.push(s.name);
    }
  }

  return (
    <>
      <PageHeader
        title="Software ทั้งหมด"
        description={`${filtered.length} รายการ`}
        actions={
          <Link
            href="/softwares/new"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> เพิ่ม Software
          </Link>
        }
      />

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Filters */}
        <form className="bg-white rounded-lg border border-slate-200 p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Software</label>
            <select
              name="software"
              defaultValue={filterSoftware || ""}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">ทั้งหมด</option>
              {uniqueSoftwareNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Vendor</label>
            <select
              name="vendor"
              defaultValue={filterVendor || ""}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">ทั้งหมด</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.name}>{v.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">License</label>
            <select
              name="license"
              defaultValue={filterLicense || ""}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">ทั้งหมด</option>
              <option value="full">เต็ม (ใช้ครบทุก seat)</option>
              <option value="available">มี seat ว่าง</option>
              <option value="unused">ยังไม่ได้ใช้งาน</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">สถานะ</label>
            <select
              name="status"
              defaultValue={filterStatus || ""}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">ทั้งหมด</option>
              <option value="expired">หมดอายุแล้ว</option>
              <option value="critical">≤ 7 วัน</option>
              <option value="warning">≤ 30 วัน</option>
              <option value="notice">≤ 60 วัน</option>
              <option value="ok">ปกติ</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              กรอง
            </button>
            <Link
              href="/softwares"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-md text-sm"
            >
              ล้าง
            </Link>
          </div>
        </form>

        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
                  <th className="text-left px-4 py-2.5">Software</th>
                  <th className="text-left px-4 py-2.5">Vendor</th>
                  <th className="text-left px-4 py-2.5">หมวดหมู่</th>
                  <th className="text-center px-4 py-2.5">License</th>
                  <th className="text-right px-4 py-2.5">ราคา/Unit</th>
                  <th className="text-right px-4 py-2.5">รวม</th>
                  <th className="text-left px-4 py-2.5">วันหมดอายุ</th>
                  <th className="text-left px-4 py-2.5">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const status = getExpiryStatus(s.expDate);
                  const days = daysUntil(s.expDate);
                  return (
                    <tr
                      key={s.id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/softwares/${s.id}`}
