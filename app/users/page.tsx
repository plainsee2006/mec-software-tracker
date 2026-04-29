import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Plus, Search } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Badge from "@/components/Badge";

export const dynamic = "force-dynamic";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: {
    q?: string;
    office?: string;
    position?: string;
    software?: string;
    license?: string;
    active?: string;
  };
}) {
  const q = searchParams.q?.trim();
  const office = searchParams.office;
  const position = searchParams.position;
  const softwareFilter = searchParams.software; // software id (string)
  const licenseFilter = searchParams.license; // "yes" | "no"
  const activeFilter = searchParams.active; // "true" | "false"

  let users: any[] = [];
  let offices: string[] = [];
  let positions: string[] = [];
  let softwareList: { id: number; name: string }[] = [];

  try {
    const where: any = {
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
        position ? { position } : {},
        activeFilter === "true"
          ? { active: true }
          : activeFilter === "false"
          ? { active: false }
          : {},
        softwareFilter
          ? {
              assignments: {
                some: {
                  softwareId: parseInt(softwareFilter, 10),
                },
              },
            }
          : {},
      ],
    };

    users = await prisma.user.findMany({
      where,
      include: {
        _count: { select: { assignments: true } },
        assignments: {
          where: { status: "Active" },
          include: { software: true },
        },
      },
      orderBy: { nameEn: "asc" },
    });

    // license filter (has/doesn't have) — apply in memory after counting
    if (licenseFilter === "yes") {
      users = users.filter((u) => u._count.assignments > 0);
    } else if (licenseFilter === "no") {
      users = users.filter((u) => u._count.assignments === 0);
    }

    const [allOffices, allPositions, allSoftware] = await Promise.all([
      prisma.user.findMany({
        select: { office: true },
        where: { office: { not: null } },
        distinct: ["office"],
      }),
      prisma.user.findMany({
        select: { position: true },
        where: { position: { not: null } },
        distinct: ["position"],
      }),
      prisma.software.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);
    offices = allOffices.map((u) => u.office!).filter(Boolean).sort();
    positions = allPositions.map((u) => u.position!).filter(Boolean).sort();
    softwareList = allSoftware;
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
        {/* Filters */}
        <form className="bg-white rounded-lg border border-slate-200 p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3">
          <div className="xl:col-span-2 relative">
            <label className="block text-xs font-medium text-slate-600 mb-1">ค้นหา</label>
            <Search className="w-4 h-4 absolute left-3 top-[2.15rem] text-slate-400" />
            <input
              type="text"
              name="q"
              defaultValue={q || ""}
              placeholder="ชื่อ / Email..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Project</label>
            <select
              name="office"
              defaultValue={office || ""}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">ทั้งหมด</option>
              {offices.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">แผนก / ฝ่าย</label>
            <select
              name="position"
              defaultValue={position || ""}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">ทั้งหมด</option>
              {positions.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Software</label>
            <select
              name="software"
              defaultValue={softwareFilter || ""}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">ทั้งหมด</option>
              {softwareList.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">License</label>
            <select
              name="license"
              defaultValue={licenseFilter || ""}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">ทั้งหมด</option>
              <option value="yes">มี License</option>
              <option value="no">ไม่มี License</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">สถานะ</label>
            <select
              name="active"
              defaultValue={activeFilter || ""}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">ทั้งหมด</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div className="xl:col-span-7 flex gap-2 justify-end pt-1">
            <Link
              href="/users"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-md text-sm"
            >
              ล้าง
            </Link>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md text-sm font-medium"
            >
              กรอง
            </button>
          </div>
        </form>

        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
                  <th className="text-center px-4 py-2.5 w-16">ลำดับ</th>
                  <th className="text-left px-4 py-2.5">ชื่อ</th>
                  <th className="text-left px-4 py-2.5">Email</th>
                  <th className="text-left px-4 py-2.5">แผนก / ฝ่าย</th>
                  <th className="text-left px-4 py-2.5">Project</th>
                  <th className="text-center px-4 py-2.5">License</th>
                  <th className="text-left px-4 py-2.5">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => (
                  <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-center text-slate-500 text-sm">{idx + 1}</td>
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
                    <td className="px-4 py-2.5">
                      {u.active ? (
                        <Badge className="bg-emerald-100 text-emerald-800">Active</Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-600">Inactive</Badge>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                      ไม่พบผู้ใช้งาน
                    </td>
            