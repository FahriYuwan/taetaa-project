import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { MovementType } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: 'No data' }, { status: 400 });

    const lines = text.trim().split('\n');
    let successCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const line of lines) {
        const [dateStr, skuCode, qtyStr, notes] = line.split('\t');
        if (!dateStr || !skuCode || !qtyStr) continue;

        const date = new Date(dateStr.trim());
        const outputQty = parseFloat(qtyStr.trim());

        const skuWithBom = await tx.sKU.findUnique({
          where: { code: skuCode.trim() },
          include: {
            bomComponents: {
              include: { child: true }
            }
          }
        });

        if (!skuWithBom || skuWithBom.type === 'RAW' || !skuWithBom.bomComponents?.length) continue;

        let totalProductionCost = 0;
        const productionInputsData = [];

        // Consume components
        for (const bom of skuWithBom.bomComponents) {
          const qtyNeeded = bom.quantity * outputQty;
          const componentCost = await tx.sKUCostHistory.findUnique({ where: { skuId: bom.childId } });

          const currentStock = componentCost?.stock || 0;
          const currentAvgCost = componentCost?.avgCost || 0;

          if (currentStock < qtyNeeded) continue; // Skip if not enough stock for this line

          totalProductionCost += qtyNeeded * currentAvgCost;

          await tx.inventory.create({
            data: {
              date,
              skuId: bom.childId,
              movement: -qtyNeeded,
              type: MovementType.PRODUCTION,
              reference: 'BULK_PROD',
            }
          });

          await tx.sKUCostHistory.update({
            where: { skuId: bom.childId },
            data: { stock: { decrement: qtyNeeded } }
          });

          productionInputsData.push({
            inputSkuId: bom.childId,
            qtyUsed: qtyNeeded
          });
        }

        if (productionInputsData.length === 0) continue;

        const productionOutput = await tx.productionOutput.create({
          data: { skuId: skuWithBom.id }
        });

        const production = await tx.production.create({
          data: {
            date,
            outputId: productionOutput.id,
            outputQty,
            notes: notes?.trim(),
            inputs: { create: productionInputsData }
          }
        });

        await tx.inventory.create({
          data: {
            date,
            skuId: skuWithBom.id,
            movement: outputQty,
            type: MovementType.PRODUCTION,
            reference: production.id,
          }
        });

        const outputCostHistory = await tx.sKUCostHistory.findUnique({ where: { skuId: skuWithBom.id } });
        const hppPerUnit = totalProductionCost / outputQty;

        if (outputCostHistory) {
          const oldStock = Math.max(0, outputCostHistory.stock);
          const oldAvgCost = outputCostHistory.avgCost;
          const newStock = outputCostHistory.stock + outputQty;
          const newAvgCost = ((oldStock * oldAvgCost) + (outputQty * hppPerUnit)) / (oldStock + outputQty);

          await tx.sKUCostHistory.update({
            where: { skuId: skuWithBom.id },
            data: { stock: newStock, avgCost: newAvgCost }
          });
        } else {
          await tx.sKUCostHistory.create({
            data: { skuId: skuWithBom.id, stock: outputQty, avgCost: hppPerUnit }
          });
        }

        successCount++;
      }
    });

    return NextResponse.json({ success: true, count: successCount, message: `${successCount} produksi berhasil diimpor` });
  } catch (error: any) {
    console.error('Bulk production import error:', error);
    return NextResponse.json({ error: 'Failed to bulk import productions' }, { status: 500 });
  }
}
