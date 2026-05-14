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
  // gradient style ตาม tone
  const palette = {
    default: {
      bar: "from-blue-500 to-indigo-600",
      iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
      iconText: "text-white",
      value: "text-slate-900",
      glow: "hover:shadow-blue-200/60",
    },
    danger: {
      bar: "from-red-500 to-rose-600",
      iconBg: "bg-gradient-to-br from-red-500 to-rose-600",
      iconText: "text-white",
      value: "text-slate-900",
      glow: "hover:shadow-red-200/60",
    },
    warn: {
      bar: "from-amber-500 to-orange-500",
      iconBg: "bg-gradient-to-br from-amber-500 to-orange-500",
      iconText: "text-white",
      value: "text-slate-900",
      glow: "hover:shadow-amber-200/60",
    },
    ok: {
      bar: "from-emerald-500 to-teal-600",
      iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
      iconText: "text-white",
      value: "text-slate-900",
      glow: "hover:shadow-emerald-200/60",
    },
  }[tone];

  return (
    <div className={cn(
      "group relative bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200",
      palette.glow
    )}>
      <div className={cn("h-1 bg-gradient-to-r", palette.bar)} />
      <div className="p-5 flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
          <div className={cn("text-3xl font-bold mt-1.5", palette.value)}>{value}</div>
          {hint && <div className="text-xs text-slate-500 mt-1.5">{hint}</div>}
        </div>
        {Icon && (
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform",
            palette.iconBg, palette.iconText
          )}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}
