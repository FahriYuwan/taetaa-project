import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { MovementType } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Data tidak boleh kosong' }, { status: 400 });
    }

    const lines = text.trim().split('\n');
    let successCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    await prisma.$transaction(async (tx) => {
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        const cols = line.split('\t');
        if (cols.length < 3) {
          skippedCount++;
          continue;
        }

        const [dateStr, skuCode, qtyStr, notes] = cols;
        const firstColUpper = dateStr?.trim().toUpperCase() || '';
        const secondColUpper = skuCode?.trim().toUpperCase() || '';

        // Abaikan header spreadsheet
        if (
          firstColUpper.startsWith('TANGGAL') ||
          firstColUpper.startsWith('DATE') ||
          firstColUpper.startsWith('NO') ||
          secondColUpper.startsWith('KODE') ||
          secondColUpper.startsWith('SKU')
        ) {
          continue;
        }

        const itemCode = skuCode?.trim();
        if (!itemCode) {
          skippedCount++;
          continue;
        }

        const parsedDate = new Date(dateStr.trim());
        const date = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
        const cleanQty = parseFloat(qtyStr.trim().replace(',', '.'));
        const outputQty = isNaN(cleanQty) || cleanQty <= 0 ? 0 : cleanQty;

        if (outputQty <= 0) {
          errors.push(`SKU "${itemCode}": Qty output (${outputQty}) tidak valid`);
          skippedCount++;
          continue;
        }

        const skuWithBom = await tx.sKU.findUnique({
          where: { code: itemCode },
          include: {
            bomComponents: {
              include: { childSku: true, childKemasan: true },
            },
          },
        });

        if (!skuWithBom) {
          errors.push(`SKU "${itemCode}" tidak ditemukan di database`);
          skippedCount++;
          continue;
        }

        if (skuWithBom.type === 'RAW') {
          errors.push(`SKU "${itemCode}" adalah tipe RAW (Bahan Baku), bukan barang hasil produksi`);
          skippedCount++;
          continue;
        }

        if (!skuWithBom.bomComponents || skuWithBom.bomComponents.length === 0) {
          errors.push(`SKU "${itemCode}" belum memiliki resep (BOM) di Master SKU`);
          skippedCount++;
          continue;
        }

        let totalProductionCost = 0;
        let canProduce = true;

        // 1. Validasi kecukupan stok semua komponen BOM
        for (const bom of skuWithBom.bomComponents) {
          const isManual = bom.consumptionType === 'MANUAL';
          const qtyNeeded = isManual ? (bom.quantity || 1) : bom.quantity * outputQty;

          if (bom.category === 'RAW' && bom.childSkuId) {
            const componentCost = await tx.sKUCostHistory.findUnique({ where: { skuId: bom.childSkuId } });
            const currentStock = componentCost?.stock || 0;
            if (currentStock < qtyNeeded) {
              const compName = bom.childSku?.name || bom.childSku?.code || 'RAW';
              errors.push(`SKU "${itemCode}": Stok bahan baku "${compName}" tidak cukup (tersedia: ${currentStock}, butuh: ${qtyNeeded})`);
              canProduce = false;
              break;
            }
          } else if (bom.childKemasanId) {
            const kemasan = await tx.masterItemKemasan.findUnique({ where: { id: bom.childKemasanId } });
            const currentStock = kemasan?.stock || 0;
            if (currentStock < qtyNeeded) {
              const compName = kemasan?.name || kemasan?.code || 'Kemasan';
              errors.push(`SKU "${itemCode}": Stok kemasan "${compName}" tidak cukup (tersedia: ${currentStock}, butuh: ${qtyNeeded})`);
              canProduce = false;
              break;
            }
          }
        }

        if (!canProduce) {
          skippedCount++;
          continue;
        }

        // 2. Buat Production Output & Record Production terlebih dahulu
        const productionOutput = await tx.productionOutput.create({
          data: { skuId: skuWithBom.id },
        });

        const production = await tx.production.create({
          data: {
            date,
            outputId: productionOutput.id,
            outputQty,
            notes: notes?.trim() || 'Bulk Import',
          },
        });

        const productionInputsData = [];
        const productionKemasanInputsData = [];

        // 3. Potong stok komponen & catat relasi input
        for (const bom of skuWithBom.bomComponents) {
          const isManual = bom.consumptionType === 'MANUAL';
          const qtyNeeded = isManual ? (bom.quantity || 1) : bom.quantity * outputQty;

          if (bom.category === 'RAW' && bom.childSkuId) {
            const componentCost = await tx.sKUCostHistory.findUnique({ where: { skuId: bom.childSkuId } });
            const currentAvgCost = componentCost?.avgCost || 0;
            totalProductionCost += qtyNeeded * currentAvgCost;

            // Catat mutasi inventori RAW
            await tx.inventory.create({
              data: {
                date,
                skuId: bom.childSkuId,
                movement: -qtyNeeded,
                type: MovementType.PRODUCTION,
                reference: production.id,
              },
            });

            // Kurangi stok di SKUCostHistory
            await tx.sKUCostHistory.update({
              where: { skuId: bom.childSkuId },
              data: { stock: { decrement: qtyNeeded } },
            });

            productionInputsData.push({
              productionId: production.id,
              inputSkuId: bom.childSkuId,
              qtyUsed: qtyNeeded,
            });
          } else if (bom.childKemasanId) {
            const kemasan = await tx.masterItemKemasan.findUnique({ where: { id: bom.childKemasanId } });
            const currentAvgCost = kemasan?.avgCost || 0;
            totalProductionCost += qtyNeeded * currentAvgCost;

            // Kurangi stok kemasan
            await tx.masterItemKemasan.update({
              where: { id: bom.childKemasanId },
              data: { stock: { decrement: qtyNeeded } },
            });

            productionKemasanInputsData.push({
              productionId: production.id,
              kemasanId: bom.childKemasanId,
              qtyUsed: qtyNeeded,
              isManual,
            });
          }
        }

        // Simpan rincian input produksi (SKU RAW & Kemasan)
        if (productionInputsData.length > 0) {
          await tx.productionInput.createMany({
            data: productionInputsData,
          });
        }
        if (productionKemasanInputsData.length > 0) {
          await tx.productionKemasanInput.createMany({
            data: productionKemasanInputsData,
          });
        }

        // 4. Tambah stok hasil produksi ke Inventory
        await tx.inventory.create({
          data: {
            date,
            skuId: skuWithBom.id,
            movement: outputQty,
            type: MovementType.PRODUCTION,
            reference: production.id,
          },
        });

        // 5. Update SKUCostHistory untuk SKU Output (weighted average)
        const outputCostHistory = await tx.sKUCostHistory.findUnique({ where: { skuId: skuWithBom.id } });
        const hppPerUnit = outputQty > 0 ? totalProductionCost / outputQty : 0;

        if (outputCostHistory) {
          const oldStock = Math.max(0, outputCostHistory.stock);
          const oldAvgCost = outputCostHistory.avgCost || 0;
          const newStock = outputCostHistory.stock + outputQty;
          const newAvgCost = newStock > 0 ? ((oldStock * oldAvgCost) + (outputQty * hppPerUnit)) / newStock : hppPerUnit;

          await tx.sKUCostHistory.update({
            where: { skuId: skuWithBom.id },
            data: { stock: newStock, avgCost: newAvgCost },
          });
        } else {
          await tx.sKUCostHistory.create({
            data: { skuId: skuWithBom.id, stock: outputQty, avgCost: hppPerUnit },
          });
        }

        successCount++;
      }
    });

    const msg = [
      `${successCount} produksi berhasil diimpor`,
      skippedCount > 0 ? `${skippedCount} baris dilewati` : '',
    ].filter(Boolean).join(', ');

    return NextResponse.json({
      success: true,
      count: successCount,
      skipped: skippedCount,
      errors,
      message: msg,
    });
  } catch (error: any) {
    console.error('Bulk production import error:', error);
    return NextResponse.json({ error: error.message || 'Failed to bulk import productions' }, { status: 500 });
  }
}
