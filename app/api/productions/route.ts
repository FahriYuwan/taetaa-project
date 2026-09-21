import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { MovementType } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const productions = await prisma.production.findMany({
      include: {
        output: {
          include: {
            sku: {
              include: {
                bomComponents: {
                  include: { childSku: true, childKemasan: true }
                }
              }
            }
          }
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
    const { date, outputSkuId, outputQty, notes, manualConsumptions } = body;

    if (!date || !outputSkuId || !outputQty) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Fetch BOM for the output SKU
    const skuWithBom = await prisma.sKU.findUnique({
      where: { id: outputSkuId },
      include: {
        bomComponents: {
          include: { 
            childSku: true,
            childKemasan: true
          }
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

      // Create Production records first
      const productionOutput = await tx.productionOutput.create({
        data: { skuId: outputSkuId }
      });

      // Build manual consumptions map for persistence
      const manualConsumptionsMap: Record<string, boolean> = {};
      for (const bom of skuWithBom.bomComponents) {
        if (bom.consumptionType === 'MANUAL') {
          const isChecked = !!(
            (bom.childKemasanId && manualConsumptions?.[bom.childKemasanId]) ||
            (bom.childKemasan?.code && manualConsumptions?.[bom.childKemasan.code]) ||
            (bom.id && manualConsumptions?.[bom.id])
          );
          if (bom.childKemasanId) manualConsumptionsMap[bom.childKemasanId] = isChecked;
          if (bom.childKemasan?.code) manualConsumptionsMap[bom.childKemasan.code] = isChecked;
        }
      }

      let taggedNotes = notes ? notes.trim() : '';
      if (Object.keys(manualConsumptionsMap).length > 0) {
        const tag = `[MANUAL_CONSUMPTIONS:${JSON.stringify(manualConsumptionsMap)}]`;
        taggedNotes = taggedNotes ? `${taggedNotes}\n${tag}` : tag;
      }

      const production = await tx.production.create({
        data: {
          date: new Date(date),
          outputId: productionOutput.id,
          outputQty,
          notes: taggedNotes || null,
        }
      });

      // A. Verify and consume components
      for (const bom of skuWithBom.bomComponents) {
        let qtyNeeded = 0;
        let currentStock = 0;
        let currentAvgCost = 0;
        let itemName = '';

        const isManual = bom.consumptionType === 'MANUAL';
        
        if (isManual) {
          const isConsumed = !!(
            manualConsumptionsMap[bom.childKemasanId!] ??
            (bom.childKemasan?.code && manualConsumptionsMap[bom.childKemasan.code]) ??
            manualConsumptions?.[bom.childKemasanId!]
          );
          if (!isConsumed) continue; // Skip if not checked
          qtyNeeded = 1; // Manual consumption is always 1 pcs
        } else {
          qtyNeeded = bom.quantity * outputQty;
        }

        if (bom.category === 'RAW') {
          const componentCost = await tx.sKUCostHistory.findUnique({
            where: { skuId: bom.childSkuId! }
          });
          currentStock = componentCost?.stock || 0;
          currentAvgCost = componentCost?.avgCost || 0;
          itemName = bom.childSku?.name || 'RAW';
        } else {
          const kemasan = await tx.masterItemKemasan.findUnique({
            where: { id: bom.childKemasanId! }
          });
          currentStock = kemasan?.stock || 0;
          currentAvgCost = kemasan?.avgCost || 0;
          itemName = kemasan?.name || 'Kemasan';
        }

        if (currentStock < qtyNeeded) {
          throw new Error(`Stok tidak cukup untuk komponen: ${itemName} (Tersedia: ${currentStock}, Dibutuhkan: ${qtyNeeded})`);
        }

        // Calculate cost contribution
        totalProductionCost += qtyNeeded * currentAvgCost;

        // B. Record component consumption
        if (bom.category === 'RAW') {
          await tx.inventory.create({
            data: {
              date: new Date(date),
              skuId: bom.childSkuId!,
              movement: -qtyNeeded,
              type: MovementType.PRODUCTION,
              reference: production.id,
            }
          });
          await tx.sKUCostHistory.update({
            where: { skuId: bom.childSkuId! },
            data: { stock: { decrement: qtyNeeded } }
          });
          productionInputsData.push({
            productionId: production.id,
            inputSkuId: bom.childSkuId!,
            qtyUsed: qtyNeeded
          });
        } else {
          // Kemasan items just get stock reduction for now
          await tx.masterItemKemasan.update({
            where: { id: bom.childKemasanId! },
            data: { stock: { decrement: qtyNeeded } }
          });
        }
      }

      // Save production inputs
      if (productionInputsData.length > 0) {
        await tx.productionInput.createMany({
          data: productionInputsData
        });
      }

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
