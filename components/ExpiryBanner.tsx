import Link from "next/link";
import { AlertCircle, AlertTriangle, Clock } from "lucide-react";
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
    <div className="space-y-3 mb-6">
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

function BannerCard({
  tone,
  icon,
  title,
  items,
}: {
  tone: "red" | "orange" | "yellow";
  icon: React.ReactNode;
  title: string;
  items: ExpiringItem[];
}) {
  const tones = {
    red: {
      wrap: "bg-red-50 border-red-200",
      head: "text-red-900",
      icon: "text-red-600",
      pill: "bg-red-100 text-red-700",
      row: "hover:bg-red-100/40",
    },
    orange: {
      wrap: "bg-orange-50 border-orange-200",
      head: "text-orange-900",
      icon: "text-orange-600",
      pill: "bg-orange-100 text-orange-700",
      row: "hover:bg-orange-100/40",
    },
    yellow: {
      wrap: "bg-yellow-50 border-yellow-200",
      head: "text-yellow-900",
      icon: "text-yellow-600",
      pill: "bg-yellow-100 text-yellow-700",
      row: "hover:bg-yellow-100/40",
    },
  }[tone];

  // เรียงจากใกล้หมดที่สุดก่อน
  const sorted = [...items].sort((a, b) => {
    const da = daysUntil(a.expDate) ?? 0;
    const db = daysUntil(b.expDate) ?? 0;
    return da - db;
  });

  const SHOW = 6;
  const display = sorted.slice(0, SHOW);
  const more = sorted.length - display.length;

  return (
    <div className={`border rounded-lg overflow-hidden ${tones.wrap}`}>
      <div className={`px-4 py-2.5 flex items-center gap-2 border-b ${tones.head}`} style={{ borderColor: "rgba(0,0,0,0.05)" }}>
        <span className={tones.icon}>{icon}</span>
        <span className="font-semibold text-sm">{title}</span>
      </div>
      <div className="divide-y divide-white/60">
        {display.map((item) => {
          const d = daysUntil(item.expDate);
          const dayText =
            d === null ? "-" : d < 0 ? `เกิน ${Math.abs(d)} วัน` : `เหลือ ${d} วัน`;
          return (
            <Link
              key={item.id}
              href={`/softwares/${item.id}`}
              className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${tones.row}`}
            >
              <span className="font-medium text-slate-900 flex-1 truncate">{item.name}</span>
              {item.vendor && (
                <span className="text-xs text-slate-500 hidden sm:inline truncate max-w-[180px]">
                  {item.vendor.name}
                </span>
              )}
              <span className="text-xs text-slate-600 font-mono whitespace-nowrap">
                {formatDate(item.expDate)}
              </span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded whitespace-nowrap ${tones.pill}`}>
                {dayText}
              </span>
            </Link>
          );
        })}
      </div>
      {more > 0 && (
        <div className="px-4 py-2 text-xs text-slate-600 bg-white/40 border-t border-white/60">
          …และอีก {more} รายการ —{" "}
          <Link href="/softwares?status=expired" className="text-blue-600 hover:underline">
            ดูทั้งหมด
          </Link>
        </div>
      )}
    </div>
  );
}
