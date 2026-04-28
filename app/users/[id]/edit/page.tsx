import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import UserForm from "@/components/UserForm";

export const dynamic = "force-dynamic";

export default async function EditUserPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (isNaN(id)) notFound();
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) notFound();

  return (
    <>
      <PageHeader
        title={`แก้ไข: ${user.nameTh || user.nameEn}`}
        breadcrumbs={[
          { href: "/users", label: "ผู้ใช้งาน" },
          { href: `/users/${user.id}`, label: user.nameTh || user.nameEn || "" },
          { label: "แก้ไข" },
        ]}
      />
      <div className="max-w-4xl mx-auto px-6 py-6">
        <UserForm initial={user} />
      </div>
    </>
  );
}
