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
              />
              <StatCard
                label="ผู้ใช้งาน"
                value={users.length}
                icon={Users}
              />
              <StatCard
                label="ใกล้หมดอายุ ≤30วัน"
                value={expiringSoon.length}
                hint={expired.length > 0 ? `หมดแล้ว ${expired.length} รายการ` : undefined}
                icon={AlertTriangle}
                tone={expiringSoon.length > 0 ? "warn" : "ok"}
              />
              <StatCard
                label="ค่าใช้จ่ายรวม"
                value={formatTHB(totalSpend)}
                hint="ค่าทั้งหมดที่ลงทุนใน Software"
                icon={DollarSign}
              />
            </div>

            {/* Software list */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">รายการ Software ทั้งหมด</h2>
                  <p className="text-xs text-slate-500 mt-0.5">เรียงตามวันใกล้หมดอายุ</p>
                </div>
                <Link
                  href="/softwares"
                  className="text-sm text-blue-600 hover:underline"
                >
                  ดูทั้งหมด →
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
                      <th className="text-left px-4 py-2.5">Software</th>
                      <th className="text-left px-4 py-2.5">Vendor</th>
                      <th className="text-center px-4 py-2.5">Licenses</th>
                      <th className="text-right px-4 py-2.5">ราคารวม</th>
                      <th className="text-left px-4 py-2.5">หมดอายุ</th>
                      <th className="text-left px-4 py-2.5">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {softwares.slice(0, 12).map((s) => {
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
                              <span className="text-xs text-slate-500 ml-2">
                                · {s.owner}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-slate-600">
                            {s.vendor?.name || "-"}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {s._count.assignments}/{s.licenseCount}
                          </td>
                          <td className="px-4 py-2.5 text-right text-slate-700 font-medium">
                            {formatTHB(s.totalPrice)}
                          </td>
                          <td className="px-4 py-2.5 text-slate-600">
                            {formatDate(s.expDate)}
                            {days !== null && (
                              <span className="text-xs text-slate-400 ml-1.5">
                                ({days} วัน)
                              </span>
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
