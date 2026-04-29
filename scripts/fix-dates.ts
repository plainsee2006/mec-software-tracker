/**
 * แก้ไขวันที่ expDate ที่อยู่ในช่วง 1900-1975 ให้บวก 57 ปี
 * (เกิดจาก Excel แปลงวันที่ พ.ศ. 2569+ ผิดเป็น ค.ศ. 1969+ ตอน import ครั้งแรก)
 *
 * วิธีใช้:
 *   npx tsx scripts/fix-dates.ts            ← preview (dry-run)
 *   npx tsx scripts/fix-dates.ts --apply    ← แก้ไขจริง
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

async function main() {
  console.log(APPLY ? "🔧 โหมดแก้ไขจริง (--apply)" : "👀 โหมด preview (ยังไม่แก้)");
  console.log("");

  // 1) หา Software ที่ expDate มีปีอยู่ในช่วง 1900-1975
  const all = await prisma.software.findMany({
    select: { id: true, name: true, expDate: true },
    orderBy: { expDate: "asc" },
  });

  const wrong = all.filter(
    (s) => s.expDate && s.expDate.getFullYear() >= 1900 && s.expDate.getFullYear() <= 1975
  );

  console.log(`📊 รวมทั้งหมด ${all.length} รายการ`);
  console.log(`❌ พบวันที่ผิด ${wrong.length} รายการ:\n`);

  for (const s of wrong) {
    const old = s.expDate!;
    const fixed = new Date(old.getFullYear() + 57, old.getMonth(), old.getDate());
    console.log(
      `  id=${String(s.id).padEnd(4)}  ${s.name.padEnd(35)}  ${old.toISOString().slice(0, 10)} → ${fixed.toISOString().slice(0, 10)}`
    );
  }

  if (!APPLY) {
    console.log(`\n💡 ถ้าผลลัพธ์ตามที่ต้องการ ให้รัน: npx tsx scripts/fix-dates.ts --apply`);
    return;
  }

  console.log(`\n🔧 กำลังแก้ไข ${wrong.length} รายการ...`);
  let ok = 0;
  for (const s of wrong) {
    const old = s.expDate!;
    const fixed = new Date(old.getFullYear() + 57, old.getMonth(), old.getDate());
    await prisma.software.update({
      where: { id: s.id },
      data: { expDate: fixed },
    });
    ok++;
  }
  console.log(`✅ แก้ไขเรียบร้อย ${ok}/${wrong.length} รายการ`);

  // 2) Recompute status ของแต่ละ software (active/expired) ตามวันที่ใหม่
  console.log("\n🔄 อัปเดต status ตามวันที่ใหม่...");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const updated = await prisma.software.findMany({
    select: { id: true, expDate: true, status: true },
  });
  let statusFixed = 0;
  for (const s of updated) {
    if (!s.expDate) continue;
    const expired = s.expDate < today;
    const want = expired ? "expired" : "active";
    if (s.status !== want && s.status !== "cancelled") {
      await prisma.software.update({ where: { id: s.id }, data: { status: want } });
      statusFixed++;
    }
  }
  console.log(`✅ ปรับ status ${statusFixed} รายการ`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
