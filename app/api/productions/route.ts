import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { MovementType } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const productions = await prisma.production.findMany({
      include: {
        output: {
          include: { sku: true }
        },
        inputs: {
          include: { inputSku: true }
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(productions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch productions' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, outputSkuId, outputQty, notes } = body;

    if (!date || !outputSkuId || !outputQty) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Fetch BOM for the output SKU
    const skuWithBom = await prisma.sKU.findUnique({
      where: { id: outputSkuId },
      include: {
        bomComponents: {
          include: { child: true }
        }
      }
    });

    if (!skuWithBom || skuWithBom.type === 'RAW') {
      return NextResponse.json({ error: 'Invalid output SKU' }, { status: 400 });
    }

    if (!skuWithBom.bomComponents || skuWithBom.bomComponents.length === 0) {
      return NextResponse.json({ error: 'SKU has no BOM defined' }, { status: 400 });
    }

    // 2. Start Transaction
    const result = await prisma.$transaction(async (tx) => {
      let totalProductionCost = 0;
      const productionInputsData = [];

      // A. Verify and consume components
      for (const bom of skuWithBom.bomComponents) {
        const qtyNeeded = bom.quantity * outputQty;

        // Get current cost history for the component
        const componentCost = await tx.sKUCostHistory.findUnique({
          where: { skuId: bom.childId }
        });

        const currentStock = componentCost?.stock || 0;
        const currentAvgCost = componentCost?.avgCost || 0;

        if (currentStock < qtyNeeded) {
          throw new Error(`Stok tidak cukup untuk komponen: ${bom.child.name} (Tersedia: ${currentStock}, Dibutuhkan: ${qtyNeeded})`);
        }

        // Calculate cost contribution
        totalProductionCost += qtyNeeded * currentAvgCost;

        // B. Record component consumption (Inventory Movement)
        await tx.inventory.create({
          data: {
            date: new Date(date),
            skuId: bom.childId,
            movement: -qtyNeeded,
            type: MovementType.PRODUCTION,
            reference: 'TEMP_PROD', // Will update later if needed or use a placeholder
          }
        });

        // C. Update component stock
        await tx.sKUCostHistory.update({
          where: { skuId: bom.childId },
          data: { stock: { decrement: qtyNeeded } }
        });

        productionInputsData.push({
          inputSkuId: bom.childId,
          qtyUsed: qtyNeeded
        });
      }

      // D. Create Production Output and Production records
      const productionOutput = await tx.productionOutput.create({
        data: { skuId: outputSkuId }
      });

      const production = await tx.production.create({
        data: {
          date: new Date(date),
          outputId: productionOutput.id,
          outputQty,
          notes,
          inputs: {
            create: productionInputsData
          }
        }
      });

      // E. Record output addition (Inventory Movement)
      await tx.inventory.create({
        data: {
          date: new Date(date),
          skuId: outputSkuId,
          movement: outputQty,
          type: MovementType.PRODUCTION,
          reference: production.id,
        }
      });

      // F. Update Output SKU Stock and HPP (Weighted Average)
      const outputCostHistory = await tx.sKUCostHistory.findUnique({
        where: { skuId: outputSkuId }
      });

      const hppPerUnit = totalProductionCost / outputQty;

      if (outputCostHistory) {
        const oldStock = Math.max(0, outputCostHistory.stock);
        const oldAvgCost = outputCostHistory.avgCost;
        const newStock = outputCostHistory.stock + outputQty;

        const newAvgCost = ((oldStock * oldAvgCost) + (outputQty * hppPerUnit)) / (oldStock + outputQty);

        await tx.sKUCostHistory.update({
          where: { skuId: outputSkuId },
          data: {
            stock: newStock,
            avgCost: newAvgCost
          }
        });
      } else {
        await tx.sKUCostHistory.create({
          data: {
            skuId: outputSkuId,
            stock: outputQty,
            avgCost: hppPerUnit
          }
        });
      }

      return production;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Production recording error:', error);
    return NextResponse.json({ error: error.message || 'Failed to record production' }, { status: 500 });
  }
}
