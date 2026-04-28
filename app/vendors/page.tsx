import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import { formatTHB } from "@/lib/utils";

export const dynamic = "force-dynamic";

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

  return (
    <>
      <PageHeader title="Vendors" description={`${vendors.length} ราย`} />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map((v) => {
            const total = v.softwares.reduce((acc: number, s: any) => acc + (s.totalPrice ?? 0), 0);
            return (
              <Link
                key={v.id}
                href={`/softwares?vendor=${encodeURIComponent(v.name)}`}
                className="bg-white rounded-lg border border-slate-200 p-5 hover:shadow-md transition"
              >
                <div className="font-semibold text-slate-900">{v.name}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {v.softwares.length} Software
                </div>
                <div className="mt-3 text-sm">
                  ค่าใช้จ่ายรวม:{" "}
                  <span className="font-semibold">{formatTHB(total)}</span>
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
