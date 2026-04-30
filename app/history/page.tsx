import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import { formatDate, formatTHB } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: { year?: string };
}) {
  const renewals = await prisma.renewal.findMany({
    include: { software: { include: { vendor: true } } },
    orderBy: { renewalDate: "desc" },
  });

  // group by year
  const byYear = new Map<number, typeof renewals>();
  for (const r of renewals) {
    const y = r.renewalDate.getFullYear();
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y)!.push(r);
  }
  const years = [...byYear.keys()].sort((a, b) => b - a);
  const selectedYear = searchParams.year
    ? parseInt(searchParams.year, 10)
    : years[0] ?? new Date().getFullYear();

  const yearItems = byYear.get(selectedYear) || [];
  const yearTotal = yearItems.reduce((acc, r) => acc + (r.amountPaid ?? 0), 0);

  return (
    <>
      <PageHeader
        title="ประวัติการต่อสัญญา"
        description="สรุปการต่ออายุ Software แยกตามปี"
      />

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Year tabs */}
        <div className="flex flex-wrap gap-2">
          {years.length === 0 && (
            <div className="text-sm text-slate-500">ยังไม่มีประวัติการต่อสัญญา</div>
          )}
          {years.map((y) => {
            const items = byYear.get(y)!;
            const total = items.reduce((acc, r) => acc + (r.amountPaid ?? 0), 0);
            const active = y === selectedYear;
            return (
              <Link
                key={y}
                href={`/history?year=${y}`}
                className={`px-4 py-3 rounded-lg border min-w-[140px] transition ${
                  active
                    ? "bg-blue-600 text-white border-blue-700"
                    : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="text-lg font-bold">{y}</div>
                <div className={`text-xs mt-1 ${active ? "text-blue-100" : "text-slate-500"}`}>
                  {items.length} รายการ • {formatTHB(total)}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Year summary */}
        {yearItems.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SummaryCard label="จำนวนการต่อสัญญา" value={`${yearItems.length} รายการ`} />
              <SummaryCard label="ค่าใช้จ่ายรวม" value={formatTHB(yearTotal)} />
              <SummaryCard
                label="โปรแกรมที่ต่อ"
                value={`${new Set(yearItems.map((r) => r.softwareId)).size} โปรแกรม`}
              />
            </div>

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200">
                <h2 className="font-semibold text-slate-900">รายการต่อสัญญาในปี {selectedYear}</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
                      <th className="text-center px-4 py-2.5 w-16">ลำดับ</th>
                      <th className="text-left px-4 py-2.5">วันที่ต่อ</th>
                      <th className="text-left px-4 py-2.5">Software</th>
                      <th className="text-left px-4 py-2.5">Vendor</th>
                      <th className="text-left px-4 py-2.5">หมดเดิม</th>
                      <th className="text-left px-4 py-2.5">หมดใหม่</th>
                      <th className="text-right px-4 py-2.5">ราคาที่จ่าย</th>
                      <th className="text-left px-4 py-2.5">บันทึกโดย</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearItems.map((r, idx) => (
                      <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-2.5 text-center text-slate-500">{idx + 1}</td>
                        <td className="px-4 py-2.5 text-slate-700 whitespace-nowrap">
                          {formatDate(r.renewalDate)}
                        </td>
                        <td className="px-4 py-2.5">
                          <Link
                            href={`/softwares/${r.softwareId}`}
                            className="font-medium text-slate-900 hover:text-blue-600"
                          >
                            {r.software.name}
                          </Link>
                          {r.software.owner && (
                            <div className="text-xs text-slate-500 mt-0.5">{r.software.owner}</div>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">
                          {r.vendor || r.software.vendor?.name || "-"}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                          {formatDate(r.expDateBefore)}
                        </td>
                        <td className="px-4 py-2.5 text-slate-700 whitespace-nowrap">
                          {formatDate(r.expDateAfter)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium">
                          {r.amountPaid !== null ? formatTHB(r.amountPaid) : "-"}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 text-xs">
                          {r.createdBy || "-"}
                        </td>
                      </tr>
                    ))}
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

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
    </div>
  );
}
