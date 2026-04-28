import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInCalendarDays, format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** จัดรูปแบบเงินไทยบาท */
export function formatTHB(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "-";
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);
}

/** แสดงวันที่ภาษาไทย เช่น 27 ธ.ค. 2026 (ปี ค.ศ.) */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  return format(d, "d MMM yyyy");
}

/** วันที่เหลือก่อนหมดอายุ — ติดลบ = หมดแล้ว */
export function daysUntil(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return null;
  return differenceInCalendarDays(d, new Date());
}

/** สถานะหมดอายุ */
export type ExpiryStatus =
  | "expired"
  | "critical"   // ≤ 7 วัน
  | "warning"    // ≤ 30 วัน
  | "notice"     // ≤ 60 วัน
  | "ok";

export function getExpiryStatus(date: Date | string | null | undefined): ExpiryStatus {
  const days = daysUntil(date);
  if (days === null) return "ok";
  if (days < 0) return "expired";
  if (days <= 7) return "critical";
  if (days <= 30) return "warning";
  if (days <= 60) return "notice";
  return "ok";
}

export function expiryStatusLabel(status: ExpiryStatus): string {
  switch (status) {
    case "expired":  return "หมดอายุแล้ว";
    case "critical": return "เหลือ ≤ 7 วัน";
    case "warning":  return "เหลือ ≤ 30 วัน";
    case "notice":   return "เหลือ ≤ 60 วัน";
    default:         return "ปกติ";
  }
}

export function expiryStatusBadgeClass(status: ExpiryStatus): string {
  switch (status) {
    case "expired":  return "bg-red-100 text-red-800 border border-red-200";
    case "critical": return "bg-red-100 text-red-800 border border-red-200";
    case "warning":  return "bg-orange-100 text-orange-800 border border-orange-200";
    case "notice":   return "bg-yellow-100 text-yellow-800 border border-yellow-200";
    default:         return "bg-emerald-100 text-emerald-800 border border-emerald-200";
  }
}

/** แปลงปี พ.ศ. → ค.ศ. ถ้าจำเป็น */
export function normalizeYear(date: Date): Date {
  const y = date.getFullYear();
  if (y >= 2400 && y <= 2700) {
    // ปี พ.ศ. → ค.ศ.
    return new Date(y - 543, date.getMonth(), date.getDate());
  }
  return date;
}

/** ค่า Threshold สำหรับการแจ้งเตือนล่วงหน้า */
export const NOTIFICATION_DAYS = [60, 30, 7] as const;
