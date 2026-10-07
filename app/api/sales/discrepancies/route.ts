import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/sales/discrepancies
// Returns all Sale records needing Finance attention:
// 1. SELISIH_QTY — qty mismatch between logistic scan and finance data (ADR Decision 2)
// 2. Unmatched scans — scanned by logistic but not yet matched with finance (ADR Decision 3)
export async function GET() {
  try {
    const [discrepancies, unmatchedScans] = await Promise.all([
      // Records flagged as SELISIH_QTY — qty mismatch, awaiting human confirmation
      prisma.sale.findMany({
        where: {
          hasDiscrepancy: true,
          status: 'SELISIH_QTY',
        },
        include: {
          sku: { select: { id: true, code: true, name: true, hppPrice: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Scanned by logistic but not yet matched with finance settlement
      prisma.sale.findMany({
        where: {
          scannedByLogistic: true,
          financeMatched: false,
          hasDiscrepancy: false, // exclude SELISIH_QTY (already in discrepancies list)
        },
        include: {
          sku: { select: { id: true, code: true, name: true, hppPrice: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      discrepancies,
      unmatchedScans,
      totalPending: discrepancies.length + unmatchedScans.length,
    });
  } catch (error) {
    console.error('Failed to fetch discrepancies:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data discrepancy' },
      { status: 500 }
    );
  }
}
