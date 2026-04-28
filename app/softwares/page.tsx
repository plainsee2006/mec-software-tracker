import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Plus, Search } from "lucide-react";
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
  searchParams: { q?: string; status?: string; vendor?: string };
}) {
  const q = searchParams.q?.trim();
  const filterStatus = searchParams.status;
  const filterVendor = searchParams.vendor;

  let softwares: any[] = [];
  let vendors: any[] = [];
  try {
    [softwares, vendors] = await Promise.all([
      prisma.software.findMany({
        where: {
          AND: [
            q
              ? {
                  OR: [
                    { name: { contains: q, mode: "insensitive" } },
                    { owner: { contains: q, mode: "insensitive" } },
                  ],
                }
              : {},
            filterVendor ? { vendor: { name: filterVendor } } : {},
          ],
        },
        include: { vendor: true, category: true, _count: { select: { assignments: true } } },
        orderBy: [{ expDate: "asc" }, { name: "asc" }],
      }),
      prisma.vendor.findMany({ orderBy: { name: "asc" } }),
    ]);
  } catch {
    // DB not ready
  }

  const filtered = filterStatus
    ? softwares.filter((s) => getExpiryStatus(s.expDate) === filterStatus)
    : softwares;

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
        <form className="bg-white rounded-lg border border-slate-200 p-4 mb-4 flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              name="q"
              defaultValue={q || ""}
              placeholder="ค้นหา ชื่อ Software / Brand..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <select
            name="vendor"
            defaultValue={filterVendor || ""}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            <option value="">Vendor: ทั้งหมด</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.name}>{v.name}</option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={filterStatus || ""}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            <option value="">สถานะ: ทั้งหมด</option>
            <option value="expired">หมดอายุแล้ว</option>
            <option value="critical">≤ 7 วัน</option>
            <option value="warning">≤ 30 วัน</option>
            <option value="notice">≤ 60 วัน</option>
            <option value="ok">ปกติ</option>
          </select>
          <button
            type="submit"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-md text-sm"
          >
            กรอง
          </button>
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
                          className="font-medium text-slate-900 hover:text-blue-600"
                        >
                          {s.name}
                        </Link>
                        {s.owner && (
                          <div className="text-xs text-slate-500 mt-0.5">{s.owner}</div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">
                        {s.vendor?.name || "-"}
                      </td>
                      <td className="px-4 py-2.5">
                        {s.category && (
                          <Badge className="bg-slate-100 text-slate-700">
                            {s.category.name}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="font-medium">{s._count.assignments}</span>
                        <span className="text-slate-400">/{s.licenseCount}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-600">
                        {formatTHB(s.pricePerUnit)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium">
                        {formatTHB(s.totalPrice)}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">
                        {formatDate(s.expDate)}
                        {days !== null && (
                          <div className="text-xs text-slate-400">{days} วัน</div>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
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
