import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Plus, Search } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Badge from "@/components/Badge";

export const dynamic = "force-dynamic";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { q?: string; office?: string };
}) {
  const q = searchParams.q?.trim();
  const office = searchParams.office;

  let users: any[] = [];
  let offices: string[] = [];
  try {
    users = await prisma.user.findMany({
      where: {
        AND: [
          q
            ? {
                OR: [
                  { nameTh: { contains: q, mode: "insensitive" } },
                  { nameEn: { contains: q, mode: "insensitive" } },
                  { email: { contains: q, mode: "insensitive" } },
                ],
              }
            : {},
          office ? { office } : {},
        ],
      },
      include: {
        _count: { select: { assignments: true } },
        assignments: {
          where: { status: "Active" },
          include: { software: true },
        },
      },
      orderBy: { nameEn: "asc" },
    });
    const allOffices = await prisma.user.findMany({
      select: { office: true },
      where: { office: { not: null } },
      distinct: ["office"],
    });
    offices = allOffices.map((u) => u.office!).filter(Boolean).sort();
  } catch {}

  return (
    <>
      <PageHeader
        title="ผู้ใช้งาน"
        description={`${users.length} คน`}
        actions={
          <Link
            href="/users/new"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> เพิ่มผู้ใช้
          </Link>
        }
      />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <form className="bg-white rounded-lg border border-slate-200 p-4 mb-4 flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              name="q"
              defaultValue={q || ""}
              placeholder="ค้นหา ชื่อ / Email..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>
          <select
            name="office"
            defaultValue={office || ""}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            <option value="">สำนักงาน: ทั้งหมด</option>
            {offices.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <button type="submit" className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-md text-sm">
            กรอง
          </button>
        </form>

        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
                  <th className="text-left px-4 py-2.5">ชื่อ</th>
                  <th className="text-left px-4 py-2.5">Email</th>
                  <th className="text-left px-4 py-2.5">ตำแหน่ง / ฝ่าย</th>
                  <th className="text-left px-4 py-2.5">สำนักงาน</th>
                  <th className="text-center px-4 py-2.5">License</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2.5">
                      <Link href={`/users/${u.id}`} className="font-medium hover:text-blue-600">
                        {u.nameTh || u.nameEn || "-"}
                      </Link>
                      {u.nameEn && u.nameTh && (
                        <div className="text-xs text-slate-500">{u.nameEn}</div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{u.email || "-"}</td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {u.position || u.department || "-"}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{u.office || "-"}</td>
                    <td className="px-4 py-2.5 text-center">
                      <Badge className="bg-blue-100 text-blue-800">
                        {u._count.assignments}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                      ไม่พบผู้ใช้งาน
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
