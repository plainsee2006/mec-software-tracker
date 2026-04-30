/**
 * Import ข้อมูลจากไฟล์ Excel (ข้อมูลโปรแกรมทั้งหมด-07-11-2568.xlsx) เข้าฐานข้อมูล
 *
 * วิธีใช้:
 *   npm run db:seed
 *
 * Script นี้จะ:
 *   1. อ่าน Sheet "รวมทุกโปรแกรม" → สร้าง Software + Vendor
 *   2. อ่าน Sheet ผู้ใช้แต่ละโปรแกรม → สร้าง User + Assignment
 *   3. แปลงปี พ.ศ. → ค.ศ. อัตโนมัติ
 */

import ExcelJS from "exceljs";
import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const candidates = [
  path.resolve(__dirname, "../../ข้อมูลโปรแกรมทั้งหมด-07-11-2568.xlsx"),
  path.resolve(__dirname, "../public/ข้อมูลโปรแกรมทั้งหมด-07-11-2568.xlsx"),
  path.resolve(__dirname, "../ข้อมูลโปรแกรมทั้งหมด-07-11-2568.xlsx"),
];
const EXCEL_PATH = candidates.find((p) => fs.existsSync(p));

if (!EXCEL_PATH) {
  console.error("❌ ไม่พบไฟล์ Excel — ต้องวางไว้ที่:");
  candidates.forEach((p) => console.error("   • " + p));
  process.exit(1);
}

console.log("📂 ใช้ไฟล์:", EXCEL_PATH);

function parseDate(v: any): Date | null {
  if (!v) return null;
  let d: Date;
  if (v instanceof Date) d = v;
  else if (typeof v === "number") {
    const utcDays = Math.floor(v - 25569);
    d = new Date(utcDays * 86400 * 1000);
  } else d = new Date(String(v));
  if (isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  // กรณี พ.ศ. ที่ยังไม่แปลง เช่น 2569, 2570
  if (y >= 2400 && y <= 2700) return new Date(y - 543, d.getMonth(), d.getDate());
  // กรณี Excel แปลงวันที่ พ.ศ. ผิด → ปีออกมาเป็น 1969-1972 (พ.ศ. 2512-2515)
  // ให้บวก 57 เพื่อแปลงกลับเป็น ค.ศ. ที่ถูกต้อง
  if (y >= 1900 && y <= 1975) return new Date(y + 57, d.getMonth(), d.getDate());
  return d;
}
const num = (v: any) => {
  if (v === null || v === undefined || v === "") return null;
  // ExcelJS may return rich-text or formula-result objects
  if (typeof v === "object" && v !== null) {
    if ("result" in v) v = v.result;
    else if ("text" in v) v = v.text;
  }
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/,/g, ""));
  return isNaN(n) ? null : n;
};
const str = (v: any) => {
  if (v === null || v === undefined) return null;
  if (typeof v === "object" && v !== null) {
    if ("richText" in v) v = (v.richText as any[]).map((r) => r.text).join("");
    else if ("result" in v) v = v.result;
    else if ("text" in v) v = v.text;
    else if ("hyperlink" in v) v = v.text || v.hyperlink;
  }
  const s = String(v).trim();
  return s === "" || s === "-" ? null : s;
};

function rowValues(row: ExcelJS.Row): any[] {
  // ExcelJS row.values is 1-indexed; convert to 0-indexed array
  const arr = row.values as any[];
  if (!Array.isArray(arr)) return [];
  return arr.slice(1);
}

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(EXCEL_PATH!);

  // ============ 1. Master Sheet ============
  console.log("\n=== Step 1: Software (Sheet 'รวมทุกโปรแกรม') ===");
  const masterSheet = wb.getWorksheet("รวมทุกโปรแกรม");
  if (!masterSheet) throw new Error("ไม่พบ Sheet 'รวมทุกโปรแกรม'");

  const masters: any[] = [];
  let lastOwner: string | null = null;
  masterSheet.eachRow({ includeEmpty: false }, (row, rowIdx) => {
    if (rowIdx === 1) return; // header
    const r = rowValues(row);
    if (!r[1]) return;
    if (r[0]) lastOwner = String(str(r[0]));
    masters.push({
      owner: lastOwner,
      program: String(str(r[1])),
      licenseCount: parseInt(String(r[2])) || 1,
      expDate: parseDate(r[3]),
      vendorName: str(r[4]),
      pricePerUnit: num(r[5]),
      totalPrice: num(r[6]),
      monthlyPrice: num(r[7]),
    });
  });
  console.log(`  พบ ${masters.length} รายการ`);

  const vendorMap = new Map<string, number>();
  for (const m of masters) {
    if (m.vendorName && !vendorMap.has(m.vendorName)) {
      const v = await prisma.vendor.upsert({
        where: { name: m.vendorName },
        create: { name: m.vendorName },
        update: {},
      });
      vendorMap.set(m.vendorName, v.id);
    }
  }
  console.log(`  Vendor: ${vendorMap.size}`);

  const categoryMap = new Map<string, number>();
  for (const m of masters) {
    if (m.owner && !categoryMap.has(m.owner)) {
      const c = await prisma.category.upsert({
        where: { name: m.owner },
        create: { name: m.owner },
        update: {},
      });
      categoryMap.set(m.owner, c.id);
    }
  }
  console.log(`  Category: ${categoryMap.size}`);

  await prisma.notificationLog.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.software.deleteMany();

  const swMap = new Map<string, number>();
  let swCount = 0;
  for (const m of masters) {
    const sw = await prisma.software.create({
      data: {
        name: m.program,
        owner: m.owner,
        licenseCount: m.licenseCount,
        expDate: m.expDate,
        pricePerUnit: m.pricePerUnit,
        totalPrice: m.totalPrice,
        monthlyPrice: m.monthlyPrice,
        vendorId: m.vendorName ? vendorMap.get(m.vendorName) : null,
        categoryId: m.owner ? categoryMap.get(m.owner) : null,
      },
    });
    swCount++;
    const key = m.program.toLowerCase().replace(/\s+/g, " ").trim();
    if (!swMap.has(key)) swMap.set(key, sw.id);
  }
  console.log(`  ✅ Software: ${swCount} รายการ`);

  // ============ 2. User + Assignment Sheets ============
  console.log("\n=== Step 2: Users + Assignments ===");

  const userMap = new Map<string, number>();
  let userCount = 0, assignCount = 0;

  function findSwId(name: string): number | null {
    const k = name.toLowerCase().replace(/\s+/g, " ").trim();
    for (const [key, id] of swMap) {
      if (key === k || key.startsWith(k) || k.startsWith(key)) return id;
    }
    return null;
  }

  const sheets: { sheetName: string; programs: string[] }[] = [
    { sheetName: "Adobe", programs: ["Acrobat Pro"] },
    { sheetName: "AutoCad LT -19-06-2026", programs: ["AutoCAD LT"] },
    { sheetName: "AutoCad LT -03-07-28", programs: ["AutoCAD LT"] },
    { sheetName: "AutoCad LT -31-08-26", programs: ["AutoCAD LT"] },
    { sheetName: "AutoCad LT -27-12-26", programs: ["AutoCAD LT"] },
    { sheetName: "AEC", programs: ["AEC"] },
    { sheetName: "AutoDesk DOC", programs: ["AutoDesk DOC", "DOC"] },
    { sheetName: "AutoCAD", programs: ["AutoCAD"] },
    { sheetName: "BIM Collaborate P", programs: ["BIM Collaborate Pro"] },
    { sheetName: "Sketchup Pro", programs: ["Sketch up Pro", "Sketchup Pro"] },
    { sheetName: "Midas", programs: ["Midas Gen Plus", "Midas"] },
    { sheetName: "Microsoft Basic", programs: ["Microsoft 365 Basic"] },
    { sheetName: "Microsft Standard", programs: ["Microsoft 365 Standard"] },
    { sheetName: "Microsoft Premium", programs: ["Microsoft 365 Premium"] },
    { sheetName: "Microsoft Project", programs: ["Microsoft Project"] },
    { sheetName: "AutoCAD LT", programs: ["AutoCAD LT"] },
    { sheetName: "AEC + DOC", programs: ["AEC", "DOC"] },
    { sheetName: "AutoCAD + BIM Collaborate P", programs: ["AutoCAD", "BIM Collaborate Pro"] },
    { sheetName: "Sketch up + Midas", programs: ["Sketch up PRO", "Midas"] },
  ];

  for (const spec of sheets) {
    const ws = wb.getWorksheet(spec.sheetName);
    if (!ws) {
      console.log(`  ⚠️  ไม่พบ sheet "${spec.sheetName}"`);
      continue;
    }

    const allRows: any[][] = [];
    ws.eachRow({ includeEmpty: true }, (row) => allRows.push(rowValues(row)));

    let headerIdx = -1;
    for (let i = 0; i < allRows.length; i++) {
      if (allRows[i][0] && String(str(allRows[i][0])) === "ลำดับ") {
        headerIdx = i; break;
      }
    }
    if (headerIdx < 0) continue;

    const headers: string[] = allRows[headerIdx].map((h) => (h ? String(str(h) || "").trim() : ""));
    const findCol = (...names: string[]) =>
      headers.findIndex((h) => names.some((n) => h.toLowerCase().includes(n.toLowerCase())));

    const cAssigned = findCol("Assigned", "Display name");
    const cFullName = findCol("ชื่อ-นามสกุล", "First name");
    const cLastName = findCol("Last name");
    const cPhone = findCol("เบอร์");
    const cPosition = findCol("ตำแหน่ง", "ฝ่าย");
    const cEmail = findCol("Email");
    const cAccount = findCol("account");
    const cRemarks = findCol("Remarks");
    const cOffice = findCol("สำนักงาน", "โครงการ");
    const cDuration = findCol("ระยะเวลา");

    let swId: number | null = null;
    for (const p of spec.programs) {
      swId = findSwId(p);
      if (swId) break;
    }
    if (!swId) {
      console.log(`  ⚠️  หา software ไม่เจอ: ${spec.programs.join(", ")}`);
      continue;
    }

    let countInSheet = 0;
    for (let i = headerIdx + 1; i < allRows.length; i++) {
      const r = allRows[i];
      if (!r) continue;
      const display = str(r[cAssigned]);
      if (!display) continue;
      if (["Status", "Active", "Inactive", "Total"].includes(display)) break;

      const fullName = cFullName >= 0 ? str(r[cFullName]) : null;
      const lastName = cLastName >= 0 ? str(r[cLastName]) : null;
      const isThai = fullName && /[฀-๿]/.test(fullName);
      const nameTh = isThai ? fullName : null;
      const nameEn = !isThai && fullName ? fullName : (lastName ? `${display} ${lastName}` : display);
      const email = cEmail >= 0 ? str(r[cEmail]) : null;
      const phone = cPhone >= 0 ? str(r[cPhone]) : null;
      const position = cPosition >= 0 ? str(r[cPosition]) : null;
      const office = cOffice >= 0 ? str(r[cOffice]) : null;
      const remarks = cRemarks >= 0 ? str(r[cRemarks]) : null;
      const duration = cDuration >= 0 ? str(r[cDuration]) : null;
      const accountEmail = cAccount >= 0 ? str(r[cAccount]) : null;

      let userId: number | null = null;
      if (display.toLowerCase() !== "ว่าง" && (email || nameTh || nameEn)) {
        const k = (email || nameEn || display).toLowerCase();
        if (userMap.has(k)) userId = userMap.get(k)!;
        else {
          try {
            const created = email
              ? await prisma.user.upsert({
                  where: { email },
                  create: {
                    nameTh, nameEn: nameEn || display, email, accountEmail,
                    phone, position, office, remarks,
                  },
                  update: { nameTh: nameTh || undefined },
                })
              : await prisma.user.create({
                  data: { nameTh, nameEn: nameEn || display, accountEmail, phone, position, office, remarks },
                });
            userId = created.id;
            userMap.set(k, userId);
            userCount++;
          } catch {}
        }
      }

      await prisma.assignment.create({
        data: {
          softwareId: swId,
          userId,
          displayName: userId ? null : display,
          status: display.toLowerCase() === "ว่าง" ? "Vacant" : "Active",
          duration,
        },
      });
      assignCount++;
      countInSheet++;
    }
    console.log(`  • ${spec.sheetName}: ${countInSheet} assignments`);
  }

  console.log(`\n  ✅ Users: ${userCount}, Assignments: ${assignCount}`);

  console.log("\n========== SUMMARY ==========");
  console.log(`  Software:    ${await prisma.software.count()}`);
  console.log(`  Vendor:      ${await prisma.vendor.count()}`);
  console.log(`  Category:    ${await prisma.category.count()}`);
  console.log(`  User:        ${await prisma.user.count()}`);
  console.log(`  Assignment:  ${await prisma.assignment.count()}`);
}

main()
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
