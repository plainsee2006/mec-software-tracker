# MEC Software Tracker

ระบบจัดการ Software License ของบริษัท MEC — สร้างด้วย **Next.js 14 + Prisma + PostgreSQL** สำหรับ Deploy บน **Vercel + Aiven**

## ✨ ฟีเจอร์หลัก

- 📦 **จัดการ Software** ทั้งหมดในที่เดียว — ชื่อ, License count, Vendor, ราคา, หมวดหมู่, วันหมดอายุ
- 👥 **จัดการผู้ใช้งาน** — ผูก License เข้ากับพนักงาน รู้ทันทีว่าใครใช้อะไร
- 🏢 **Vendors** — ดูค่าใช้จ่ายแยกตามผู้จำหน่าย
- ⏰ **แจ้งเตือนหมดอายุ** ล่วงหน้า 60 / 30 / 7 วัน + เมื่อหมดแล้ว
  - 🌐 Banner หน้า Dashboard
  - 📧 Email อัตโนมัติ
  - 💬 LINE (Messaging API หรือ Notify)
- 🔄 **Cron Job** อัตโนมัติทุกวันบน Vercel
- 📊 **Import จาก Excel** ที่มีอยู่ได้เลย

## 🚀 ขั้นตอน Setup (ครั้งแรก)

### 1. ติดตั้ง Dependencies

```bash
cd WebApp
npm install
```

### 2. สร้างฐานข้อมูล Aiven PostgreSQL

1. เข้า [aiven.io](https://aiven.io) → สมัคร / Login
2. **Create Service** → เลือก **PostgreSQL** → เลือก Free tier
3. รอ 2-3 นาทีให้ database พร้อม
4. คลิก service → ไปแท็บ **Overview** → คัดลอก **Service URI**  
   รูปแบบ: `postgres://avnadmin:xxxx@pg-xxxx.aivencloud.com:12345/defaultdb?sslmode=require`

### 3. ตั้งค่า Environment Variables

```bash
cp .env.example .env.local
```

แก้ไข `.env.local`:

```env
DATABASE_URL="postgres://avnadmin:xxxx@pg-xxxx.aivencloud.com:12345/defaultdb?sslmode=require"
CRON_SECRET="<สุ่มมาสักยาวๆ>"
ALERT_EMAILS="itadmin@mec-eng.co.th,patiwat.m@mec-eng.co.th"
```

### 4. สร้าง Schema และ Import ข้อมูล

```bash
# สร้างตารางในฐานข้อมูล
npm run db:push

# Import ข้อมูลจาก Excel ที่มีอยู่
npm run db:seed
```

ผลลัพธ์:
```
✅ Software:    16 รายการ
✅ Vendor:      4
✅ Category:    3 (Adobe, Autodesk, Microsoft)
✅ Users:       ~80
✅ Assignments: ~120
```

### 5. ทดลองรัน Local

```bash
npm run dev
```

เปิด http://localhost:3000

## ☁️ Deploy ไปที่ Vercel

### 1. Push Code ขึ้น GitHub

```bash
cd WebApp
git init
git add .
git commit -m "Initial: MEC Software Tracker"
git branch -M main
git remote add origin https://github.com/<your-username>/mec-software-tracker.git
git push -u origin main
```

### 2. Deploy ผ่าน Vercel

1. ไปที่ [vercel.com/new](https://vercel.com/new) → เชื่อมต่อ GitHub repo ที่เพิ่ง push
2. ตอน Configure Project ให้กรอก **Environment Variables** จาก `.env.local`:
   - `DATABASE_URL`
   - `CRON_SECRET`
   - `ALERT_EMAILS`
   - (ตั้งค่า Email/LINE ในข้อ 3)
3. กด **Deploy**

### 3. ตั้งค่า Email (เลือกหนึ่งวิธี)

#### วิธี A: Resend (แนะนำ — ฟรี 3,000 emails/เดือน)
1. ไปที่ [resend.com](https://resend.com) → สมัคร
2. Verify Domain (หรือใช้ `onboarding@resend.dev` ทดลองก่อน)
3. คัดลอก API Key
4. เพิ่มใน Vercel Environment Variables:
   ```
   EMAIL_PROVIDER=resend
   RESEND_API_KEY=re_xxxxx
   EMAIL_FROM="MEC Tracker <noreply@yourdomain.com>"
   ```

#### วิธี B: Gmail SMTP
1. เปิด 2-Step Verification ใน Google Account
2. สร้าง [App Password](https://myaccount.google.com/apppasswords)
3. เพิ่มใน Vercel:
   ```
   EMAIL_PROVIDER=smtp
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=youremail@gmail.com
   SMTP_PASS=<app-password>
   EMAIL_FROM="MEC Tracker <youremail@gmail.com>"
   ```

### 4. ตั้งค่า LINE (เลือกหนึ่งวิธี)

#### วิธี A: LINE Messaging API (แนะนำ)
1. ไปที่ [LINE Developers Console](https://developers.line.biz/console/)
2. สร้าง Provider → Channel → Messaging API
3. คัดลอก **Channel Access Token**
4. เชิญ Bot เข้า Group → ใช้ Webhook ดึง Group ID
5. เพิ่มใน Vercel:
   ```
   LINE_CHANNEL_ACCESS_TOKEN=xxxxx
   LINE_TARGET_IDS=Cxxxxx,Uxxxxx
   ```

#### วิธี B: LINE Notify *(หยุดให้บริการ 31 มี.ค. 2025)*
ถ้ายังใช้ได้:
```
LINE_NOTIFY_TOKEN=xxxxx
```

### 5. Re-deploy

หลังเพิ่ม env vars แล้ว → ใน Vercel กด **Redeploy**

### 6. Import ข้อมูลครั้งแรกบน Production

ไฟล์ Excel จะถูก deploy ไปด้วยใน `public/` ดังนั้นเข้าไปที่:

```
https://<your-app>.vercel.app/settings
```

แล้วกดปุ่ม **เริ่ม Import**

## ⏰ Cron Job (แจ้งเตือนอัตโนมัติ)

ระบบจะรันทุกวันเวลา **08:00 UTC** (15:00 ไทย) — ตั้งค่าใน `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/check-expiry",
      "schedule": "0 1 * * *"
    }
  ]
}
```

> 💡 Vercel Hobby plan: รองรับ Cron Jobs ฟรี (รันได้สูงสุดวันละ 1 ครั้ง)
> สำหรับรันบ่อยกว่านั้นต้อง upgrade Pro

### Logic การแจ้งเตือน

- เมื่อ Software เหลือ ≤ 60 วัน → แจ้งเตือนรอบแรก
- เมื่อเหลือ ≤ 30 วัน → แจ้งเตือนรอบที่สอง
- เมื่อเหลือ ≤ 7 วัน → แจ้งเตือนสุดท้าย

แต่ละ Software จะแจ้งแค่ครั้งเดียวต่อ Threshold (กัน Spam) — ถ้าแก้วันหมดอายุใหม่ ระบบจะรีเซ็ต log ให้

## 📂 โครงสร้างโปรเจกต์

```
WebApp/
├── app/                       # Next.js App Router
│   ├── page.tsx               # Dashboard
│   ├── softwares/             # หน้า CRUD Software
│   ├── users/                 # หน้า CRUD Users
│   ├── vendors/               # หน้า Vendors
│   ├── categories/            # หน้าหมวดหมู่
│   ├── settings/              # ตั้งค่า + ทดสอบ
│   └── api/                   # API Routes
│       ├── softwares/
│       ├── users/
│       ├── cron/check-expiry/ # 🤖 Cron endpoint
│       ├── settings/test-*/   # ทดสอบ Email/LINE
│       └── import/            # Import Excel
├── components/                # UI Components
├── lib/
│   ├── prisma.ts              # Prisma client
│   ├── notifications.ts       # Email + LINE
│   └── utils.ts               # date / format helpers
├── prisma/
│   └── schema.prisma          # Database Schema
├── scripts/
│   └── import-excel.ts        # CLI Import
├── public/
│   └── ข้อมูลโปรแกรมทั้งหมด-07-11-2568.xlsx
└── vercel.json                # Cron config
```

## 🛠 Commands

| Command | คำอธิบาย |
|---------|----------|
| `npm run dev` | รัน Development Server |
| `npm run build` | Build สำหรับ Production |
| `npm run start` | รัน Production Server (หลัง build) |
| `npm run db:push` | สร้าง/Update Schema ในฐานข้อมูล |
| `npm run db:seed` | Import ข้อมูลจาก Excel |
| `npm run db:studio` | เปิด Prisma Studio (ดู/แก้ DB ผ่าน UI) |

## 📝 หมายเหตุเรื่องวันที่ใน Excel

ข้อมูลเดิมในไฟล์ Excel มีบางวันที่เป็นปี **พ.ศ.** (เช่น 2569) — ระบบจะแปลงเป็น **ค.ศ.** ให้อัตโนมัติ
ส่วนวันที่ผิดเช่น 1969, 1971 (พบใน AutoCAD LT บางรายการ) — แนะนำให้แก้ไขผ่านหน้าเว็บเมื่อ Import เสร็จ

## 🔐 Security

- Cron endpoint ป้องกันด้วย `CRON_SECRET` (Vercel จะส่ง header `Authorization: Bearer <secret>` อัตโนมัติ)
- ปัจจุบันไม่มี Login — ใครก็เข้าดูได้ ดังนั้นไม่ควรเปิด public ให้คนนอก
- หากต้องการเพิ่ม Login ภายหลัง สามารถใช้ NextAuth.js / Clerk ได้

## 🐛 Troubleshooting

**Error: Can't reach database server**
- เช็ค `DATABASE_URL` ใน Vercel Environment Variables
- ตรวจสอบว่า Aiven service เปิดอยู่ และ IP Allowlist อนุญาต Vercel (default `0.0.0.0/0`)

**Email ไม่ส่ง**
- ไปที่ `/settings` แล้วกด **ทดสอบ** เพื่อดู error
- ตรวจสอบ Resend API Key หรือ SMTP credentials

**LINE ไม่ส่ง**
- หาก Bot เพิ่งสร้าง ต้องเชิญเข้ากลุ่มก่อน
- Group ID ต้องขึ้นต้นด้วย `C` หรือ `R`, User ID ขึ้นต้นด้วย `U`

## 📄 License

Internal use only — MEC Engineering
