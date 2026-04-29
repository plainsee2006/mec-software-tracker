import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { LayoutDashboard, Package, Users, Building2, Tag, Settings } from "lucide-react";
import Providers from "./Providers";
import LogoutButton from "@/components/LogoutButton";

export const metadata: Metadata = {
  title: "MEC Software Tracker",
  description: "ระบบจัดการ Software License และผู้ใช้งาน",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/softwares", label: "Software", icon: Package },
    { href: "/users", label: "ผู้ใช้งาน", icon: Users },
    { href: "/vendors", label: "Vendors", icon: Building2 },
    { href: "/categories", label: "หมวดหมู่", icon: Tag },
    { href: "/settings", label: "ตั้งค่า", icon: Settings },
  ];

  return (
    <html lang="th">
      <body>
        <Providers>
          <div className="min-h-screen flex">
            <aside className="w-60 bg-slate-900 text-slate-100 flex flex-col">
              <div className="px-5 py-5 border-b border-slate-800">
                <div className="text-lg font-bold">MEC Software</div>
                <div className="text-xs text-slate-400 mt-0.5">License Tracker</div>
              </div>
              <nav className="flex-1 py-3">
                {navItems.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 px-5 py-2.5 text-sm hover:bg-slate-800 transition"
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                ))}
              </nav>
              <div className="border-t border-slate-800 py-2">
                <LogoutButton />
              </div>
              <div className="px-5 py-3 text-xs text-slate-500 border-t border-slate-800">
                v1.0 · MEC Engineering
              </div>
            </aside>
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
