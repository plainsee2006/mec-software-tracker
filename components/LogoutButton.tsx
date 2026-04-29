"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    try {
      await fetch("/api/admin-auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={pending}
      className="flex items-center gap-3 px-5 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition w-full disabled:opacity-50"
    >
      <LogOut className="w-4 h-4" />
      {pending ? "กำลังออก..." : "ออกจากระบบ"}
    </button>
  );
}
