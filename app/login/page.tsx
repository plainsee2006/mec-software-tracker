"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-white rounded-2xl shadow-xl p-10 flex flex-col items-center gap-6 w-80">
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-800">MEC Software</div>
          <div className="text-sm text-slate-500 mt-1">License Tracker</div>
        </div>

        <div className="w-full border-t border-slate-100" />

        <div className="text-sm text-slate-600 text-center">
          เข้าสู่ระบบด้วยบัญชี LINE ของคุณ
        </div>

        <button
          onClick={() => signIn("line", { callbackUrl: "/" })}
          className="w-full flex items-center justify-center gap-3 bg-[#06C755] hover:bg-[#05a849] text-white font-semibold py-3 px-6 rounded-xl transition"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C6.48 2 2 6.03 2 11c0 3.19 1.78 6.01 4.54 7.76-.2.71-.74 2.56-.85 2.96-.13.48.18.47.38.34.15-.1 2.44-1.62 3.43-2.28.64.09 1.3.14 1.97.14 5.52 0 10-4.03 10-9S17.52 2 12 2z"/>
          </svg>
          เข้าสู่ระบบด้วย LINE
        </button>
      </div>
    </div>
  );
}
