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

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-white text-slate-600 text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-semibold">Software</th>
                  <th className="text-left px-4 py-3 font-semibold">Vendor</th>
                  <th className="text-left px-4 py-3 font-semibold">หมวดหมู่</th>
                  <th className="text-left px-4 py-3 font-semibold w-44">License</th>
                  <th className="text-right px-4 py-3 font-semibold">ราคา/Unit</th>
                  <th className="text-right px-4 py-3 font-semibold">รวม</th>
                  <th className="text-left px-4 py-3 font-semibold">วันหมดอายุ</th>
                  <th className="text-left px-4 py-3 font-semibold">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const status = getExpiryStatus(s.expDate);
                  const days = daysUntil(s.expDate);
                  const used = s._count.assignments;
                  const total = s.licenseCount;
                  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
                  const usageBar =
                    used > total ? "bg-red-500" :
                    pct >= 100 ? "bg-amber-500" :
                    pct >= 70 ? "bg-blue-500" :
                    "bg-emerald-500";
                  let h = 0;
                  for (let i = 0; i < s.name.length; i++) h = (h * 31 + s.name.charCodeAt(i)) >>> 0;
                  const grads = [
                    "from-blue-500 to-indigo-600",
                    "from-emerald-500 to-teal-600",
                    "from-amber-500 to-orange-500",
                    "from-rose-500 to-pink-500",
                    "from-violet-500 to-purple-600",
                    "from-sky-500 to-cyan-500",
                    "from-fuchsia-500 to-pink-600",
                    "from-lime-500 to-green-600",
                  ];
                  const grad = grads[h % grads.length];
                  const initial = s.name.trim().slice(0, 1).toUpperCase();
                  return (
                    <tr
                      key={s.id}
                      className="border-t border-slate-100 hover:bg-blue-50/40 transition-colors group"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${grad} text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform flex-shrink-0`}>
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/softwares/${s.id}`}
                              className="font-semibold text-slate-900 hover:text-blue-600 block truncate"
                            >
                              {s.name}
                            </Link>
                            {s.owner && (
                              <div className="text-xs text-slate-500">{s.owner}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {s.vendor?.name ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                            {s.vendor.name}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="px-4 py-3">
                        {s.category && (
                          <Badge className="bg-slate-100 text-slate-700">
                            {s.category.name}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                            {used}/{total}
                          </span>
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden min-w-[60px]">
                            <div
                              className={`h-full ${usageBar} transition-all duration-500`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600 tabular-nums">
                        {formatTHB(s.pricePerUnit)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900 tabular-nums">
                        {formatTHB(s.totalPrice)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-700 font-medium whitespace-nowrap">{formatDate(s.expDate)}</div>
                        {days !== null && (
                          <div className={`text-xs ${days < 0 ? "text-red-500" : days <= 30 ? "text-amber-600" : "text-slate-400"}`}>
                            {days < 0 ? `เกิน ${Math.abs(days)} วัน` : `เหลือ ${days} วัน`}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={expiryStatusBadgeClass(status)}>
                          {expiryStatusLabel(status)}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                      ไม่พบ Software ที่ตรงกับเงื่อนไข
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
