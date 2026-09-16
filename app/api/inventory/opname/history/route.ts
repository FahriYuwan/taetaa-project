import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/inventory/opname/history — list all opname sessions (newest first)
export async function GET() {
  try {
    const sessions = await prisma.stockOpname.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { items: true } },
      },
    });

    const data = sessions.map((s) => ({
      id: s.id,
      opnameNumber: s.opnameNumber,
      date: s.date,
      notes: s.notes,
      status: s.status,
      itemCount: s._count.items,
      createdAt: s.createdAt,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch opname history:", error);
    return NextResponse.json({ error: "Failed to fetch opname history" }, { status: 500 });
  }
}