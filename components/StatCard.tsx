import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "danger" | "warn" | "ok";
}) {
  const toneMap = {
    default: "bg-white border-slate-200",
    danger:  "bg-red-50 border-red-200",
    warn:    "bg-orange-50 border-orange-200",
    ok:      "bg-emerald-50 border-emerald-200",
  };
  const iconTone = {
    default: "text-slate-400 bg-slate-100",
    danger:  "text-red-600 bg-red-100",
    warn:    "text-orange-600 bg-orange-100",
    ok:      "text-emerald-600 bg-emerald-100",
  };

  return (
    <div className={cn("rounded-lg border p-4 flex items-start justify-between", toneMap[tone])}>
      <div>
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</div>
        <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
        {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
      </div>
      {Icon && (
        <div className={cn("w-10 h-10 rounded-md flex items-center justify-center", iconTone[tone])}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}
