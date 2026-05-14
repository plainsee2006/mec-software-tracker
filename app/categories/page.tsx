import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import { Tag, Package, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

const GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-violet-500 to-purple-600",
  "from-sky-500 to-cyan-500",
  "from-fuchsia-500 to-pink-600",
  "from-lime-500 to-green-600",
  "from-red-500 to-orange-600",
  "from-cyan-500 to-blue-600",
];

function hash(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h;
}

function initials(name: string): string {
  const c = name.trim();
  if (/[฀-๿]/.test(c)) return c.slice(0, 1);
  return c.slice(0, 2).toUpperCase();
}

export default async function CategoriesPage() {
  let categories: any[] = [];
  try {
    categories = await prisma.category.findMany({
      include: { softwares: { select: { id: true, totalPrice: true } } },
      orderBy: { name: "asc" },
    });
  } catch {}

  const totalSw = categories.reduce((acc, c) => acc + c.softwares.length, 0);

  return (
    <>
      <PageHeader title="หมวดหมู่ Software" description={`${categories.length} หมวด · รวม ${totalSw} Software`} />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((c) => {
            const grad = GRADIENTS[hash(c.name) % GRADIENTS.length];
            const sharePct = totalSw > 0 ? Math.round((c.softwares.length / totalSw) * 100) : 0;
            return (
              <Link
                key={c.id}
                href={`/softwares?owner=${encodeURIComponent(c.name)}`}
                className="group relative bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200"
              >
                <div className={`h-1.5 bg-gradient-to-r ${grad}`} />
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform bg-gradient-to-br ${grad} text-white`}>
                      {initials(c.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{c.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <Tag className="w-3 h-3" /> หมวดหมู่
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-transform" />
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-slate-500" />
                      <span className="text-xs text-slate-500">Software</span>
                    </div>
                    <span className={`text-lg font-bold bg-gradient-to-r ${grad} bg-clip-text text-transparent`}>
                      {c.softwares.length}
                    </span>
                  </div>

                  <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${grad} transition-all duration-500 group-hover:brightness-110`}
                      style={{ width: `${sharePct}%` }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
          {categories.length === 0 && (
            <div className="col-span-full text-center text-slate-500 py-12">ยังไม่มีหมวดหมู่</div>
          )}
        </div>
      </div>
    </>
  );
}
