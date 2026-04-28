import Link from "next/link";
import { AlertTriangle, AlertCircle } from "lucide-react";
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
        <BannerRow
          color="red"
          icon={<AlertCircle className="w-5 h-5" />}
          title={`หมดอายุแล้ว ${expired.length} รายการ`}
          items={expired}
        />
      )}
      {critical.length > 0 && (
        <BannerRow
          color="red"
          icon={<AlertCircle className="w-5 h-5" />}
          title={`เหลือเวลา ≤ 7 วัน — ${critical.length} รายการ`}
          items={critical}
        />
      )}
      {warning.length > 0 && (
        <BannerRow
          color="orange"
          icon={<AlertTriangle className="w-5 h-5" />}
          title={`ใกล้หมดอายุ ≤ 30 วัน — ${warning.length} รายการ`}
          items={warning}
        />
      )}
      {notice.length > 0 && (
        <BannerRow
          color="yellow"
          icon={<AlertTriangle className="w-5 h-5" />}
          title={`เตรียมต่ออายุ ≤ 60 วัน — ${notice.length} รายการ`}
          items={notice}
        />
      )}
    </div>
  );
}

function BannerRow({
  color,
  icon,
  title,
  items,
}: {
  color: "red" | "orange" | "yellow";
  icon: React.ReactNode;
  title: string;
  items: ExpiringItem[];
}) {
  const colorMap = {
    red: "bg-red-50 text-red-900 border-red-200",
    orange: "bg-orange-50 text-orange-900 border-orange-200",
    yellow: "bg-yellow-50 text-yellow-900 border-yellow-200",
  };

  return (
    <div className={`border-l-4 rounded-md px-4 py-3 ${colorMap[color]}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div className="flex-1">
          <div className="font-semibold">{title}</div>
          <div className="mt-1 text-sm flex flex-wrap gap-x-4 gap-y-1">
            {items.slice(0, 8).map((item) => {
              const d = daysUntil(item.expDate);
              return (
                <Link
                  key={item.id}
                  href={`/softwares/${item.id}`}
                  className="hover:underline"
                >
                  <b>{item.name}</b>
                  {item.vendor && (
                    <span className="text-xs opacity-75"> · {item.vendor.name}</span>
                  )}
                  <span className="text-xs opacity-75">
                    {" "}· {formatDate(item.expDate)} ({d} วัน)
                  </span>
                </Link>
              );
            })}
            {items.length > 8 && (
              <span className="text-xs opacity-75">…และอีก {items.length - 8} รายการ</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
