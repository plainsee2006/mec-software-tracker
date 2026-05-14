import Link from "next/link";
import { AlertCircle, AlertTriangle, Clock, ChevronRight } from "lucide-react";
import { formatDate, daysUntil } from "@/lib/utils";

interface ExpiringItem {
  id: number;
  name: string;
  expDate: Date | null;
  vendor?: { name: string } | null;
}

export default function ExpiryBanner({ items }: { items: ExpiringItem[] }) {
  if (!items || items.length === 0) return null;

  const expired = items.filter((i) => {
    const d = daysUntil(i.expDate);
    return d !== null && d < 0;
  });
  const critical = items.filter((i) => {
    const d = daysUntil(i.expDate);
    return d !== null && d >= 0 && d <= 7;
  });
  const warning = items.filter((i) => {
    const d = daysUntil(i.expDate);
    return d !== null && d > 7 && d <= 30;
  });
  const notice = items.filter((i) => {
    const d = daysUntil(i.expDate);
    return d !== null && d > 30 && d <= 60;
  });

  return (
    <div className="space-y-4 mb-6">
      {expired.length > 0 && (
        <BannerCard
          tone="red"
          icon={<AlertCircle className="w-5 h-5" />}
          title={`หมดอายุแล้ว ${expired.length} รายการ`}
          items={expired}
        />
      )}
      {critical.length > 0 && (
        <BannerCard
          tone="red"
          icon={<AlertCircle className="w-5 h-5" />}
          title={`เหลือเวลา ≤ 7 วัน — ${critical.length} รายการ`}
          items={critical}
        />
      )}
      {warning.length > 0 && (
        <BannerCard
          tone="orange"
          icon={<AlertTriangle className="w-5 h-5" />}
          title={`ใกล้หมดอายุ ≤ 30 วัน — ${warning.length} รายการ`}
          items={warning}
        />
      )}
      {notice.length > 0 && (
        <BannerCard
          tone="yellow"
          icon={<Clock className="w-5 h-5" />}
          title={`เตรียมต่ออายุ ≤ 60 วัน — ${notice.length} รายการ`}
          items={notice}
        />
      )}
    </div>
  );
}

const GRADS = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-violet-500 to-purple-600",
  "from-sky-500 to-cyan-500",
  "from-fuchsia-500 to-pink-600",
  "from-lime-500 to-green-600",
];

function avatarGrad(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return GRADS[h % GRADS.length];
}

function BannerCard({
  tone, icon, title, items,
}: {
  tone: "red" | "orange" | "yellow";
  icon: React.ReactNode;
  title: string;
  items: ExpiringItem[];
}) {
  const styles = {
    red: {
      ring: "border-red-200 shadow-red-100/60",
      bar: "from-red-500 to-rose-600",
      headBg: "bg-gradient-to-r from-red-50 to-rose-50",
      headTxt: "text-red-900",
      iconWrap: "bg-gradient-to-br from-red-500 to-rose-600 text-white shadow",
      pill: "bg-red-100 text-red-700 border-red-200",
    },
    orange: {
      ring: "border-orange-200 shadow-orange-100/60",
      bar: "from-amber-500 to-orange-500",
      headBg: "bg-gradient-to-r from-orange-50 to-amber-50",
      headTxt: "text-orange-900",
      iconWrap: "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow",
      pill: "bg-orange-100 text-orange-700 border-orange-200",
    },
    yellow: {
      ring: "border-yellow-200 shadow-yellow-100/60",
      bar: "from-yellow-400 to-amber-500",
      headBg: "bg-gradient-to-r from-yellow-50 to-amber-50",
      headTxt: "text-amber-900",
      iconWrap: "bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow",
      pill: "bg-yellow-100 text-yellow-800 border-yellow-200",
    },
  }[tone];

  const sorted = [...items].sort((a, b) => {
    const da = daysUntil(a.expDate) ?? 0;
    const db = daysUntil(b.expDate) ?? 0;
    return da - db;
  });

  const SHOW = 6;
  const display = sorted.slice(0, SHOW);
  const more = sorted.length - display.length;

  return (
    <div className={`bg-white border rounded-xl overflow-hidden shadow-sm ${styles.ring}`}>
      <div className={`h-1 bg-gradient-to-r ${styles.bar}`} />
      <div className={`px-5 py-3 flex items-center gap-3 ${styles.headBg}`}>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${styles.iconWrap}`}>
          {icon}
        </div>
        <div className="flex-1">
          <div className={`font-semibold text-sm ${styles.headTxt}`}>{title}</div>
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {display.map((item) => {
          const d = daysUntil(item.expDate);
          const dayText =
            d === null ? "-" : d < 0 ? `เกิน ${Math.abs(d)} วัน` : `เหลือ ${d} วัน`;
          const grad = avatarGrad(item.name);
          return (
            <Link
              key={item.id}
              href={`/softwares/${item.id}`}
              className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors group"
            >
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${grad} text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform flex-shrink-0`}>
                {item.name.trim().slice(0, 1).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900 truncate">{item.name}</div>
                {item.vendor && (
                  <div className="text-xs text-slate-500 truncate">{item.vendor.name}</div>
                )}
              </div>
              <span className="text-xs text-slate-600 font-mono whitespace-nowrap hidden sm:inline">
                {formatDate(item.expDate)}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border whitespace-nowrap ${styles.pill}`}>
                {dayText}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
            </Link>
          );
        })}
      </div>
      {more > 0 && (
        <div className="px-5 py-2.5 text-xs text-slate-600 bg-slate-50/50 border-t border-slate-100">
          …และอีก {more} รายการ —{" "}
          <Link href="/softwares" className="text-blue-600 hover:underline font-medium">
            ดูทั้งหมด
          </Link>
        </div>
      )}
    </div>
  );
}
