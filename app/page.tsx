import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Package, Users, AlertTriangle, DollarSign } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import ExpiryBanner from "@/components/ExpiryBanner";
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

export default async function DashboardPage() {
  // ดึงข้อมูลสรุปจาก DB
  let softwares: any[] = [];
  let users: any[] = [];
  let totalSpend = 0;
  let dbReady = true;

  try {
    [softwares, users] = await Promise.all([
      prisma.software.findMany({
        include: { vendor: true, category: true, _count: { select: { assignments: true } } },
        orderBy: { expDate: "asc" },
      }),
      prisma.user.findMany(),
    ]);
    totalSpend = softwares.reduce((acc, s) => acc + (s.totalPrice ?? 0), 0);
  } catch (e) {
    dbReady = false;
  }

  const expiring = softwares.filter((s) => {
    const d = daysUntil(s.expDate);
    return d !== null && d <= 60;
  });

  const expiringSoon = softwares.filter((s) => {
    const d = daysUntil(s.expDate);
    return d !== null && d <= 30;
  });

  const expired = softwares.filter((s) => {
    const d = daysUntil(s.expDate);
    return d !== null && d < 0;
  });

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="ภาพรวม Software License ของบริษัท"
      />

      <div className="max-w-7xl mx-auto px-6 py-6">
        {!dbReady ? (
          <DbNotReadyMessage />
        ) : (
          <>
            <ExpiryBanner items={expiring} />

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                label="รายการ Software"
                value={softwares.length}
                icon={Package}
                tone="default"
              />
              <StatCard
                label="ผู้ใช้งาน"
                value={users.length}
                icon={Users}
                tone="ok"
              />
              <StatCard
                label="ใกล้หมดอายุ ≤30วัน"
                value={expiringSoon.length}
                hint={expired.length > 0 ? `หมดแล้ว ${expired.length} รายการ` : undefined}
                icon={AlertTriangle}
                tone={expired.length > 0 ? "danger" : expiringSoon.length > 0 ? "warn" : "ok"}
              />
              <StatCard
                label="ค่าใช้จ่ายรวม"
                value={formatTHB(totalSpend)}
                hint="ค่าทั้งหมดที่ลงทุนใน Software"
                icon={DollarSign}
                tone="warn"
              />
            </div>

            {/* Software list */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                <div>
                  <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600" />
                    รายการ Software ทั้งหมด
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">เรียงตามวันใกล้หมดอายุ · {softwares.length} รายการ</p>
                </div>
                <Link
                  href="/softwares"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 group"
                >
                  ดูทั้งหมด <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50/60 text-slate-600 text-xs uppercase tracking-wider">
                      <th className="text-left px-5 py-3 font-semibold">Software</th>
                      <th className="text-left px-4 py-3 font-semibold">Vendor</th>
                      <th className="text-left px-4 py-3 font-semibold w-44">Licenses</th>
                      <th className="text-right px-4 py-3 font-semibold">ราคารวม</th>
                      <th className="text-left px-4 py-3 font-semibold">หมดอายุ</th>
                      <th className="text-left px-4 py-3 font-semibold">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {softwares.slice(0, 12).map((s) => {
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
                      // hash → color for software icon
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
                                  <span className="text-xs text-slate-500">{s.owner}</span>
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
                    {softwares.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                          ยังไม่มีข้อมูล Software —{" "}
                          <Link href="/softwares/new" className="text-blue-600 hover:underline">
                            เพิ่มรายการแรก
                          </Link>{" "}
                          หรือ Import จาก Excel
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function DbNotReadyMessage() {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <h3 className="font-semibold text-yellow-900">ยังไม่ได้เชื่อมต่อฐานข้อมูล</h3>
      <p className="text-sm text-yellow-800 mt-2">
        กรุณาตั้งค่า <code>DATABASE_URL</code> ในไฟล์ <code>.env.local</code> และรัน{" "}
        <code>npm run db:push</code> เพื่อสร้าง Schema
      </p>
      <p className="text-sm text-yellow-800 mt-2">
        จากนั้นรัน <code>npm run db:seed</code> เพื่อ Import ข้อมูลจาก Excel ที่มีอยู่
      </p>
      <p className="text-xs text-yellow-700 mt-3">
        ดูคำแนะนำเพิ่มเติมในไฟล์ <code>README.md</code>
      </p>
    </div>
  );
}
