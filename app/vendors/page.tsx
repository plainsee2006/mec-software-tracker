import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import { formatTHB } from "@/lib/utils";
import { Package, DollarSign, ChevronRight, Building2, TrendingUp, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

// 8 ชุดสี gradient — เลือกตามชื่อ (hash) ให้แต่ละ vendor มีสีคงที่
const GRADIENTS = [
  { bar: "from-blue-500 to-indigo-500", avatar: "bg-gradient-to-br from-blue-500 to-indigo-600 text-white", glow: "hover:shadow-blue-200/60" },
  { bar: "from-emerald-500 to-teal-500", avatar: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white", glow: "hover:shadow-emerald-200/60" },
  { bar: "from-amber-500 to-orange-500", avatar: "bg-gradient-to-br from-amber-500 to-orange-500 text-white", glow: "hover:shadow-amber-200/60" },
  { bar: "from-rose-500 to-pink-500", avatar: "bg-gradient-to-br from-rose-500 to-pink-500 text-white", glow: "hover:shadow-rose-200/60" },
  { bar: "from-violet-500 to-purple-500", avatar: "bg-gradient-to-br from-violet-500 to-purple-600 text-white", glow: "hover:shadow-violet-200/60" },
  { bar: "from-sky-500 to-cyan-500", avatar: "bg-gradient-to-br from-sky-500 to-cyan-500 text-white", glow: "hover:shadow-sky-200/60" },
  { bar: "from-fuchsia-500 to-pink-500", avatar: "bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white", glow: "hover:shadow-fuchsia-200/60" },
  { bar: "from-lime-500 to-green-500", avatar: "bg-gradient-to-br from-lime-500 to-green-600 text-white", glow: "hover:shadow-lime-200/60" },
];

function hash(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h;
}

function initials(name: string): string {
  const cleaned = name.trim();
  if (/[฀-๿]/.test(cleaned)) return cleaned.slice(0, 1);
  const parts = cleaned.split(/[\s.-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return cleaned.slice(0, 2).toUpperCase();
}

export default async function VendorsPage() {
  let vendors: any[] = [];
  try {
    vendors = await prisma.vendor.findMany({
      include: {
        softwares: {
          select: { id: true, totalPrice: true },
        },
      },
      orderBy: { name: "asc" },
    });
  } catch {}

  // คำนวณยอดรวม
  const totalSpend = vendors.reduce(
    (acc, v) => acc + v.softwares.reduce((a: number, s: any) => a + (s.totalPrice ?? 0), 0),
    0
  );
  const totalSoftware = vendors.reduce((acc, v) => acc + v.softwares.length, 0);
  const topVendor = vendors
    .map((v) => ({
      name: v.name,
      total: v.softwares.reduce((a: number, s: any) => a + (s.totalPrice ?? 0), 0),
    }))
    .sort((a, b) => b.total - a.total)[0];

  return (
    <>
      <PageHeader title="Vendors" description={`${vendors.length} ราย — ภาพรวมผู้จำหน่ายทั้งหมด`} />

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Top summary banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <SummaryCard
            icon={<Building2 className="w-5 h-5" />}
            label="Vendors ทั้งหมด"
            value={vendors.length.toString()}
            gradient="from-blue-500 to-indigo-600"
          />
          <SummaryCard
            icon={<Package className="w-5 h-5" />}
            label="Software ทั้งหมด"
            value={totalSoftware.toString()}
            gradient="from-emerald-500 to-teal-600"
          />
          <SummaryCard
            icon={<DollarSign className="w-5 h-5" />}
            label="งบรวมทั้งหมด"
            value={formatTHB(totalSpend)}
            gradient="from-amber-500 to-orange-600"
            badge={topVendor ? `Top: ${topVendor.name}` : undefined}
          />
        </div>

        {/* Vendor cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map((v) => {
            const total = v.softwares.reduce((acc: number, s: any) => acc + (s.totalPrice ?? 0), 0);
            const sharePct = totalSpend > 0 ? Math.round((total / totalSpend) * 100) : 0;
            const palette = GRADIENTS[hash(v.name) % GRADIENTS.length];

            return (
              <Link
                key={v.id}
                href={`/softwares?vendor=${encodeURIComponent(v.name)}`}
                className={`group relative bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-xl ${palette.glow} hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200`}
              >
                {/* Gradient bar top */}
                <div className={`h-1.5 bg-gradient-to-r ${palette.bar}`} />

                <div className="p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform ${palette.avatar}`}>
                      {initials(v.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 truncate flex items-center gap-1">
                        {v.name}
                        {v.softwares.length >= 5 && (
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" aria-label="popular" />
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        ผู้จำหน่าย
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-transform" />
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Package className="w-3.5 h-3.5 text-slate-600" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wide">Software</div>
                        <div className="text-sm font-bold text-slate-900">
                          {v.softwares.length}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wide">สัดส่วน</div>
                        <div className="text-sm font-bold text-slate-900">
                          {sharePct}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Money line */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-500">ค่าใช้จ่ายรวม</span>
                    <span className={`text-base font-bold bg-gradient-to-r ${palette.bar} bg-clip-text text-transparent`}>
                      {formatTHB(total)}
                    </span>
                  </div>

                  {/* Progress bar — share of total */}
                  <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${palette.bar} transition-all duration-500 group-hover:brightness-110`}
                      style={{ width: `${sharePct}%` }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
          {vendors.length === 0 && (
            <div className="col-span-full text-center text-slate-500 py-12">
              ยังไม่มี Vendor
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function SummaryCard({
  icon, label, value, gradient, badge,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  gradient: string;
  badge?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-xl p-5 text-white bg-gradient-to-br ${gradient} shadow-lg`}>
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -right-6 top-8 w-16 h-16 rounded-full bg-white/10" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-2 opacity-90">
          {icon}
          <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
        </div>
        <div className="text-2xl font-bold">{value}</div>
        {badge && <div className="text-xs opacity-80 mt-1 truncate">{badge}</div>}
      </div>
    </div>
  );
}
