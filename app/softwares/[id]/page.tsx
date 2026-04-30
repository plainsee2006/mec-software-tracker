import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Pencil, Plus } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Badge from "@/components/Badge";
import RenewalPanel from "@/components/RenewalPanel";
import {
  formatDate,
  formatTHB,
  daysUntil,
  getExpiryStatus,
  expiryStatusBadgeClass,
  expiryStatusLabel,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SoftwareDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);
  if (isNaN(id)) notFound();

  const sw = await prisma.software.findUnique({
    where: { id },
    include: {
      vendor: true,
      category: true,
      assignments: {
        include: { user: true },
        orderBy: { id: "asc" },
      },
      renewals: {
        orderBy: { renewalDate: "desc" },
      },
    },
  });
  if (!sw) notFound();

  const status = getExpiryStatus(sw.expDate);
  const days = daysUntil(sw.expDate);
  const activeCount = sw.assignments.filter((a) => a.status === "Active").length;

  return (
    <>
      <PageHeader
        title={sw.name}
        description={sw.owner ? `Brand: ${sw.owner}` : undefined}
        breadcrumbs={[
          { href: "/softwares", label: "Software" },
          { label: sw.name },
        ]}
        actions={
          <>
            <Link
              href={`/softwares/${sw.id}/edit`}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              <Pencil className="w-4 h-4" /> แก้ไข
            </Link>
          </>
        }
      />

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Info card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5 lg:col-span-2">
            <h2 className="font-semibold text-slate-900 mb-4">รายละเอียด</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 text-sm">
              <Field label="Vendor" value={sw.vendor?.name || "-"} />
              <Field label="หมวดหมู่" value={sw.category?.name || "-"} />
              <Field label="License ทั้งหมด" value={String(sw.licenseCount)} />
              <Field label="ราคา/Unit" value={formatTHB(sw.pricePerUnit)} />
              <Field label="ราคารวม" value={formatTHB(sw.totalPrice)} />
              <Field label="ราคา/เดือน" value={formatTHB(sw.monthlyPrice)} />
              <Field label="วันหมดอายุ" value={formatDate(sw.expDate)} />
              <Field
                label="เหลือ"
                value={days === null ? "-" : `${days} วัน`}
              />
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">สถานะ</div>
                <Badge className={expiryStatusBadgeClass(status)}>
                  {expiryStatusLabel(status)}
                </Badge>
              </div>
            </div>
            {sw.description && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">คำอธิบาย</div>
                <p className="text-sm text-slate-700 whitespace-pre-line">
                  {sw.description}
                </p>
              </div>
            )}
            {sw.notes && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">หมายเหตุ</div>
                <p className="text-sm text-slate-700 whitespace-pre-line">{sw.notes}</p>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h2 className="font-semibold text-slate-900 mb-4">การใช้งาน License</h2>
            <div className="text-3xl font-bold text-slate-900">
              {activeCount}
              <span className="text-base text-slate-400 font-normal"> / {sw.licenseCount}</span>
            </div>
            <div className="text-sm text-slate-500 mt-1">License ที่ใช้งานอยู่</div>

            <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500"
                style={{
                  width: `${Math.min(100, (activeCount / Math.max(sw.licenseCount, 1)) * 100)}%`,
                }}
              />
            </div>

            <div className="mt-4 text-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">ที่นั่งว่าง</span>
                <span className="font-medium">
                  {Math.max(0, sw.licenseCount - activeCount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ผู้ใช้งานทั้งหมด</span>
                <span className="font-medium">{sw.assignments.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Renewal Panel */}
        <RenewalPanel
          softwareId={sw.id}
          currentExpDate={sw.expDate ? sw.expDate.toISOString() : null}
          renewals={sw.renewals.map((r) => ({
            id: r.id,
            renewalDate: r.renewalDate.toISOString(),
            expDateBefore: r.expDateBefore ? r.expDateBefore.toISOString() : null,
            expDateAfter: r.expDateAfter.toISOString(),
            amountPaid: r.amountPaid,
            vendor: r.vendor,
            notes: r.notes,
            createdBy: r.createdBy,
          }))}
        />

        {/* Assignments */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">รายชื่อผู้ใช้งาน</h2>
              <p className="text-xs text-slate-500 mt-0.5">{sw.assignments.length} รายการ</p>
            </div>
            <Link
              href={`/softwares/${sw.id}/edit#assign`}
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
            >
              <Plus className="w-4 h-4" /> เพิ่มผู้ใช้
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
                  <th className="text-left px-4 py-2.5 w-10">#</th>
                  <th className="text-left px-4 py-2.5">ชื่อ</th>
                  <th className="text-left px-4 py-2.5">Email</th>
                  <th className="text-left px-4 py-2.5">ตำแหน่ง / ฝ่าย</th>
                  <th className="text-left px-4 py-2.5">สำนักงาน</th>
                  <th className="text-left px-4 py-2.5">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {sw.assignments.map((a, i) => (
                  <tr key={a.id} className="border-t border-slate-100">
                    <td className="px-4 py-2.5 text-slate-400">{i + 1}</td>
                    <td className="px-4 py-2.5">
                      {a.user ? (
                        <Link
                          href={`/users/${a.user.id}`}
                          className="font-medium hover:text-blue-600"
                        >
                          {a.user.nameTh || a.user.nameEn || "-"}
                        </Link>
                      ) : (
                        <span className="text-slate-400 italic">
                          {a.displayName || "ว่าง"}
                        </span>
                      )}
                      {a.user?.nameEn && a.user.nameTh && (
                        <div className="text-xs text-slate-500">{a.user.nameEn}</div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {a.user?.email || "-"}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {a.user?.position || a.user?.department || "-"}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {a.user?.office || "-"}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge
                        className={
                          a.status === "Active"
                            ? "bg-emerald-100 text-emerald-800"
                            : a.status === "Vacant"
                            ? "bg-slate-100 text-slate-600"
                            : "bg-slate-100 text-slate-500"
                        }
                      >
                        {a.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {sw.assignments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                      ยังไม่มีผู้ใช้งาน
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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500 uppercase tracking-wide">{label}</div>
      <div className="text-slate-900 mt-0.5">{value}</div>
    </div>
  );
}
