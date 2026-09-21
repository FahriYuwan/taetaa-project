import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { MovementType } from '@prisma/client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const production = await prisma.production.findUnique({
      where: { id },
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
        }
      }
    });

    if (!production) {
      return NextResponse.json({ error: 'Produksi tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(production);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch production' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { date, outputQty, notes } = body;

    const parsedQty = parseFloat(outputQty);
    if (!date || isNaN(parsedQty) || parsedQty <= 0) {
      return NextResponse.json({ error: 'Tanggal dan Qty Output harus valid' }, { status: 400 });
    }

    const production = await prisma.production.findUnique({
      where: { id },
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
        }
      }
    });

    if (!production) {
      return NextResponse.json({ error: 'Produksi tidak ditemukan' }, { status: 404 });
    }

    const outputSku = production.output.sku;
    const outputSkuId = outputSku.id;
    const isQtyChanged = parsedQty !== production.outputQty;
    const prodDate = new Date(date);

    const updated = await prisma.$transaction(async (tx) => {
      if (isQtyChanged) {
        // 1. ROLLBACK PREVIOUS PRODUCTION EFFECTS
        // A. Restore previously consumed RAW stock
        for (const input of production.inputs) {
          await tx.sKUCostHistory.update({
            where: { skuId: input.inputSkuId },
            data: { stock: { increment: input.qtyUsed } }
          });
        }

        // B. Restore previously consumed Kemasan stock
        if (outputSku.bomComponents) {
          for (const bom of outputSku.bomComponents) {
            if (bom.category !== 'RAW' && bom.childKemasanId && bom.consumptionType === 'AUTOMATIC') {
              const oldKemasanQty = bom.quantity * production.outputQty;
              await tx.masterItemKemasan.update({
                where: { id: bom.childKemasanId },
                data: { stock: { increment: oldKemasanQty } }
              });
            }
          }
        }

        // C. Decrement old output stock
        await tx.sKUCostHistory.update({
          where: { skuId: outputSkuId },
          data: { stock: { decrement: production.outputQty } }
        });

        // D. Delete old inventory records and inputs
        await tx.inventory.deleteMany({
          where: { reference: id }
        });
        await tx.productionInput.deleteMany({
          where: { productionId: id }
        });

        // 2. APPLY NEW PRODUCTION EFFECTS
        let totalProductionCost = 0;
        const newProductionInputs = [];

        // Verify stock sufficiency for new qty
        for (const bom of outputSku.bomComponents) {
          if (bom.consumptionType === 'MANUAL') continue;
          const qtyNeeded = bom.quantity * parsedQty;

          if (bom.category === 'RAW' && bom.childSkuId) {
            const costHist = await tx.sKUCostHistory.findUnique({ where: { skuId: bom.childSkuId } });
            const currentStock = costHist?.stock || 0;
            if (currentStock < qtyNeeded) {
              throw new Error(`Stok tidak cukup untuk ${bom.childSku?.name || 'RAW'} (Tersedia: ${currentStock}, Butuh: ${qtyNeeded})`);
            }
            totalProductionCost += qtyNeeded * (costHist?.avgCost || 0);

            await tx.inventory.create({
              data: {
                date: prodDate,
                skuId: bom.childSkuId,
                movement: -qtyNeeded,
                type: MovementType.PRODUCTION,
                reference: id,
              }
            });
            await tx.sKUCostHistory.update({
              where: { skuId: bom.childSkuId },
              data: { stock: { decrement: qtyNeeded } }
            });
            newProductionInputs.push({
              productionId: id,
              inputSkuId: bom.childSkuId,
              qtyUsed: qtyNeeded
            });
          } else if (bom.childKemasanId) {
            const kemasan = await tx.masterItemKemasan.findUnique({ where: { id: bom.childKemasanId } });
            const currentStock = kemasan?.stock || 0;
            if (currentStock < qtyNeeded) {
              throw new Error(`Stok tidak cukup untuk kemasan ${kemasan?.name || 'Kemasan'} (Tersedia: ${currentStock}, Butuh: ${qtyNeeded})`);
            }
            totalProductionCost += qtyNeeded * (kemasan?.avgCost || 0);

            await tx.masterItemKemasan.update({
              where: { id: bom.childKemasanId },
              data: { stock: { decrement: qtyNeeded } }
            });
          }
        }

        // Save new inputs
        if (newProductionInputs.length > 0) {
          await tx.productionInput.createMany({
            data: newProductionInputs
          });
        }

        // Create new output inventory movement
        await tx.inventory.create({
          data: {
            date: prodDate,
            skuId: outputSkuId,
            movement: parsedQty,
            type: MovementType.PRODUCTION,
            reference: id,
          }
        });

        // Update output stock and weighted average HPP
        const outputCostHistory = await tx.sKUCostHistory.findUnique({ where: { skuId: outputSkuId } });
        const hppPerUnit = totalProductionCost / parsedQty;
        if (outputCostHistory) {
          const oldStock = Math.max(0, outputCostHistory.stock);
          const oldAvgCost = outputCostHistory.avgCost;
          const newStock = outputCostHistory.stock + parsedQty;
          const newAvgCost = oldStock + parsedQty > 0
            ? ((oldStock * oldAvgCost) + (parsedQty * hppPerUnit)) / (oldStock + parsedQty)
            : hppPerUnit;

          await tx.sKUCostHistory.update({
            where: { skuId: outputSkuId },
            data: { stock: newStock, avgCost: newAvgCost }
          });
        } else {
          await tx.sKUCostHistory.create({
            data: { skuId: outputSkuId, stock: parsedQty, avgCost: hppPerUnit }
          });
        }
      } else {
        // If qty did not change, just update the date in associated inventory records
        await tx.inventory.updateMany({
          where: { reference: id },
          data: { date: prodDate }
        });
      }

      // Update the production record itself while preserving any [MANUAL_CONSUMPTIONS:...] tag
      let finalNotes = notes?.trim() || null;
      const tagMatch = production.notes?.match(/\[MANUAL_CONSUMPTIONS:.*?\]/);
      if (tagMatch && finalNotes && !finalNotes.includes('[MANUAL_CONSUMPTIONS:')) {
        finalNotes = `${finalNotes}\n${tagMatch[0]}`;
      } else if (tagMatch && !finalNotes) {
        finalNotes = tagMatch[0];
      }

      const updatedProd = await tx.production.update({
        where: { id },
        data: {
          date: prodDate,
          outputQty: parsedQty,
          notes: finalNotes,
        },
        include: {
          output: { include: { sku: true } },
          inputs: { include: { inputSku: true } }
        }
      });

      return updatedProd;
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Failed to update production:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memperbarui produksi' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const production = await prisma.production.findUnique({
      where: { id },
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
        }
      }
    });

    if (!production) {
      return NextResponse.json({ error: 'Produksi tidak ditemukan' }, { status: 404 });
    }

    const outputSku = production.output.sku;
    const outputSkuId = outputSku.id;

    await prisma.$transaction(async (tx) => {
      // 1. Restore consumed RAW components stock
      for (const input of production.inputs) {
        await tx.sKUCostHistory.update({
          where: { skuId: input.inputSkuId },
          data: {
            stock: { increment: input.qtyUsed }
          }
        });
      }

      // 2. Restore consumed Kemasan components stock
      if (outputSku.bomComponents) {
        for (const bom of outputSku.bomComponents) {
          if (bom.category !== 'RAW' && bom.childKemasanId && bom.consumptionType === 'AUTOMATIC') {
            const kemasanQty = bom.quantity * production.outputQty;
            await tx.masterItemKemasan.update({
              where: { id: bom.childKemasanId },
              data: {
                stock: { increment: kemasanQty }
              }
            });
          }
        }
      }

      // 3. Decrement produced output stock
      const outputCost = await tx.sKUCostHistory.findUnique({
        where: { skuId: outputSkuId }
      });
      if (outputCost) {
        await tx.sKUCostHistory.update({
          where: { skuId: outputSkuId },
          data: {
            stock: { decrement: production.outputQty }
          }
        });
      }

      // 4. Delete inventory movements associated with this production
      await tx.inventory.deleteMany({
        where: { reference: id }
      });

      // 5. Delete production inputs
      await tx.productionInput.deleteMany({
        where: { productionId: id }
      });

      // 6. Delete production
      await tx.production.delete({
        where: { id }
      });

      // 7. Delete production output
      await tx.productionOutput.delete({
        where: { id: production.outputId }
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Produksi berhasil dihapus dan seluruh stok bahan telah dikembalikan.'
    });
  } catch (error: any) {
    console.error('Failed to delete production:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menghapus produksi' },
      { status: 500 }
    );
  }
}
