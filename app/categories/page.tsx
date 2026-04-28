import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  let categories: any[] = [];
  try {
    categories = await prisma.category.findMany({
      include: { softwares: { select: { id: true } } },
      orderBy: { name: "asc" },
    });
  } catch {}

  return (
    <>
      <PageHeader title="หมวดหมู่ Software" description={`${categories.length} หมวด`} />
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-2.5">หมวดหมู่</th>
                <th className="text-center px-4 py-2.5">จำนวน Software</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="px-4 py-2.5">
                    <span
                      className="inline-block w-3 h-3 rounded-full mr-2 align-middle"
                      style={{ background: c.color || "#3b82f6" }}
                    />
                    {c.name}
                  </td>
                  <td className="px-4 py-2.5 text-center">{c.softwares.length}</td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-12 text-center text-slate-500">
                    ยังไม่มีหมวดหมู่
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
