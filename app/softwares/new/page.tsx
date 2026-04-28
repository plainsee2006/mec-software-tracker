import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import SoftwareForm from "@/components/SoftwareForm";

export const dynamic = "force-dynamic";

export default async function NewSoftwarePage() {
  const [vendors, categories] = await Promise.all([
    prisma.vendor.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <PageHeader
        title="เพิ่ม Software"
        breadcrumbs={[
          { href: "/softwares", label: "Software" },
          { label: "เพิ่มใหม่" },
        ]}
      />
      <div className="max-w-4xl mx-auto px-6 py-6">
        <SoftwareForm vendors={vendors} categories={categories} />
      </div>
    </>
  );
}
