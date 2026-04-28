import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Pencil, Mail, Phone } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Badge from "@/components/Badge";
import { formatDate, getExpiryStatus, expiryStatusBadgeClass, expiryStatusLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function UserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);
  if (isNaN(id)) notFound();

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      assignments: {
        include: { software: { include: { vendor: true } } },
        orderBy: { id: "desc" },
      },
    },
  });
  if (!user) notFound();

  return (
    <>
      <PageHeader
        title={user.nameTh || user.nameEn || `User ${user.id}`}
        description={user.position || user.department || undefined}
        breadcrumbs={[
          { href: "/users", label: "ผู้ใช้งาน" },
          { label: user.nameTh || user.nameEn || "" },
        ]}
        actions={
          <Link
            href={`/users/${user.id}/edit`}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            <Pencil className="w-4 h-4" /> แก้ไข
          </Link>
        }
      />
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <h2 className="font-semibold text-slate-900 mb-4">ข้อมูลผู้ใช้</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 text-sm">
            <Field label="ชื่อ-นามสกุล (TH)" value={user.nameTh} />
            <Field label="Display Name (EN)" value={user.nameEn} />
            <Field label="Email" value={user.email} />
            <Field label="Account Email" value={user.accountEmail} />
            <Field label="เบอร์โทร" value={user.phone} />
            <Field label="ตำแหน่ง" value={user.position} />
            <Field label="ฝ่าย" value={user.department} />
            <Field label="สำนักงาน" value={user.office} />
            <Field label="หมายเหตุ" value={user.remarks} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">License ที่ใช้งาน</h2>
            <p className="text-xs text-slate-500 mt-0.5">{user.assignments.length} รายการ</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-2.5">Software</th>
                <th className="text-left px-4 py-2.5">Vendor</th>
                <th className="text-left px-4 py-2.5">วันหมดอายุ</th>
                <th className="text-left px-4 py-2.5">สถานะ</th>
                <th className="text-left px-4 py-2.5">License Status</th>
              </tr>
            </thead>
            <tbody>
              {user.assignments.map((a) => {
                const status = getExpiryStatus(a.software.expDate);
                return (
                  <tr key={a.id} className="border-t border-slate-100">
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/softwares/${a.software.id}`}
                        className="font-medium hover:text-blue-600"
                      >
                        {a.software.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{a.software.vendor?.name || "-"}</td>
                    <td className="px-4 py-2.5 text-slate-600">{formatDate(a.software.expDate)}</td>
                    <td className="px-4 py-2.5">
                      <Badge className={expiryStatusBadgeClass(status)}>
                        {expiryStatusLabel(status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge className="bg-slate-100 text-slate-700">{a.status}</Badge>
                    </td>
                  </tr>
                );
              })}
              {user.assignments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    ยังไม่ได้รับ License ใดๆ
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

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div className="text-xs text-slate-500 uppercase tracking-wide">{label}</div>
      <div className="text-slate-900 mt-0.5">{value || "-"}</div>
    </div>
  );
}
