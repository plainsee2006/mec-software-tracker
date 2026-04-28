import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const SoftwareSchema = z.object({
  name: z.string().min(1),
  owner: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  licenseCount: z.number().int().min(0).default(1),
  expDate: z.string().nullable().optional(),
  pricePerUnit: z.number().nullable().optional(),
  totalPrice: z.number().nullable().optional(),
  monthlyPrice: z.number().nullable().optional(),
  vendorId: z.number().nullable().optional(),
  categoryId: z.number().nullable().optional(),
  vendorNew: z.string().nullable().optional(),
  categoryNew: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function GET() {
  const items = await prisma.software.findMany({
    include: { vendor: true, category: true, _count: { select: { assignments: true } } },
    orderBy: { expDate: "asc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SoftwareSchema.parse(body);

    const data: any = {
      name: parsed.name,
      owner: parsed.owner ?? null,
      description: parsed.description ?? null,
      licenseCount: parsed.licenseCount,
      expDate: parsed.expDate ? new Date(parsed.expDate) : null,
      pricePerUnit: parsed.pricePerUnit ?? null,
      totalPrice: parsed.totalPrice ?? null,
      monthlyPrice: parsed.monthlyPrice ?? null,
      notes: parsed.notes ?? null,
    };

    if (parsed.vendorNew) {
      const vendor = await prisma.vendor.upsert({
        where: { name: parsed.vendorNew },
        create: { name: parsed.vendorNew },
        update: {},
      });
      data.vendorId = vendor.id;
    } else if (parsed.vendorId) {
      data.vendorId = parsed.vendorId;
    }

    if (parsed.categoryNew) {
      const c = await prisma.category.upsert({
        where: { name: parsed.categoryNew },
        create: { name: parsed.categoryNew },
        update: {},
      });
      data.categoryId = c.id;
    } else if (parsed.categoryId) {
      data.categoryId = parsed.categoryId;
    }

    const created = await prisma.software.create({ data });
    return NextResponse.json(created);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Invalid input" }, { status: 400 });
  }
}
