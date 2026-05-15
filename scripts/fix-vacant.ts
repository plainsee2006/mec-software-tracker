/**
 * แก้ assignment ที่เป็น "ว่าง" แต่ status = Active → เปลี่ยนเป็น Vacant
 *
 * วิธีใช้:
 *   npx tsx scripts/fix-vacant.ts          ← preview
 *   npx tsx scripts/fix-vacant.ts --apply  ← แก้ไขจริง
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

async function main() {
  console.log(APPLY ? "🔧 โหมดแก้ไขจริง (--apply)" : "👀 โหมด preview (ยังไม่แก้)");
  console.log();

  const assignments = await prisma.assignment.findMany({
    where: { status: "Active" },
    include: { user: true, software: { select: { name: true } } },
  });

  const toFix = assignments.filter((a) => {
    const name = (a.user?.nameTh || a.user?.nameEn || a.displayName || "").trim();
    return name === "ว่าง" || name === "" || name === "-";
  });

  console.log(`📊 รวม Active assignments: ${assignments.length}`);
  console.log(`❌ ต้องแก้เป็น Vacant: ${toFix.length}\n`);

  toFix.slice(0, 30).forEach((a) => {
    const name = a.user?.nameTh || a.user?.nameEn || a.displayName || "?";
    console.log(`  id=${String(a.id).padEnd(5)}  ${a.software.name.padEnd(30)}  "${name}"`);
  });
  if (toFix.length > 30) console.log(`  ... และอีก ${toFix.length - 30} รายการ`);

  if (!APPLY) {
    console.log(`\n💡 ถ้าโอเค รัน: npx tsx scripts/fix-vacant.ts --apply`);
    return;
  }

  console.log(`\n🔧 กำลังแก้ ${toFix.length} รายการ...`);
  let ok = 0;
  for (const a of toFix) {
    await prisma.assignment.update({
      where: { id: a.id },
      data: { status: "Vacant" },
    });
    ok++;
  }
  console.log(`✅ แก้เรียบร้อย ${ok}/${toFix.length} รายการ`);
}

main()
  .catch((e) => { console.error("❌", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
