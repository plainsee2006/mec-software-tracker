import PageHeader from "@/components/PageHeader";
import UserForm from "@/components/UserForm";

export default function NewUserPage() {
  return (
    <>
      <PageHeader
        title="เพิ่มผู้ใช้"
        breadcrumbs={[{ href: "/users", label: "ผู้ใช้งาน" }, { label: "เพิ่มใหม่" }]}
      />
      <div className="max-w-4xl mx-auto px-6 py-6">
        <UserForm />
      </div>
    </>
  );
}
