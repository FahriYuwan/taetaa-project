async function test() {
  const base = 'http://localhost:3000';
  console.log('Testing GET /api/skus...');
  const resSkus = await fetch(`${base}/api/skus`);
  const skus = await resSkus.json();
  console.log(`Fetched ${skus.length} SKUs`);
  for (const s of skus) {
    console.log(`- ${s.code}: stock=${s.stock}, stockMin=${s.stockMin}`);
  }

  console.log('\nTesting GET /api/inventory/summary...');
  const resInv = await fetch(`${base}/api/inventory/summary?from=2026-08-01&to=2026-09-30`);
  const inv = await resInv.json();
  console.log(`Fetched ${inv.items.length} inventory items`);
  for (const item of inv.items) {
    console.log(`- ${item.code}: stockAkhir=${item.stockAkhir}, stockMin=${item.stockMin}`);
  }
}

test().catch(console.error);
