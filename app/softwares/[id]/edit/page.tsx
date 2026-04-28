import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import SoftwareForm from "@/components/SoftwareForm";

export const dynamic = "force-dynamic";

export default async function EditSoftwarePage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);
  if (isNaN(id)) notFound();

  const [sw, vendors, categories] = await Promise.all([
    prisma.software.findUnique({ where: { id } }),
    prisma.vendor.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!sw) notFound();

  return (
    <>
      <PageHeader
        title={`แก้ไข: ${sw.name}`}
        breadcrumbs={[
          { href: "/softwares", label: "Software" },
          { href: `/softwares/${sw.id}`, label: sw.name },
          { label: "แก้ไข" },
        ]}
      />
      <div className="max-w-4xl mx-auto px-6 py-6">
        <SoftwareForm initial={sw} vendors={vendors} categories={categories} />
      </div>
    </>
  );
}
