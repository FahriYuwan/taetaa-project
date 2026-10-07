import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateBody,
  createSaleSchema,
  createPurchaseSchema,
  createProductionSchema,
} from '../lib/validations';

describe('Validation Schemas', () => {
  describe('createSaleSchema', () => {
    it('passes with valid sale payload', () => {
      const payload = {
        date: '2026-10-07',
        skuId: 'sku-123',
        qty: 5,
        unitPrice: 50000,
        channel: 'SHOPEE',
      };
      const result = validateBody(createSaleSchema, payload);
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.qty, 5);
        assert.equal(result.data.channel, 'SHOPEE');
      }
    });

    it('rejects non-positive qty', () => {
      const payload = {
        date: '2026-10-07',
        skuId: 'sku-123',
        qty: -2,
        channel: 'TIKTOK',
      };
      const result = validateBody(createSaleSchema, payload);
      assert.equal(result.success, false);
      if (!result.success) {
        assert.match(result.error, /lebih besar dari 0/i);
      }
    });

    it('rejects invalid channel', () => {
      const payload = {
        date: '2026-10-07',
        skuId: 'sku-123',
        qty: 1,
        channel: 'AMAZON',
      };
      const result = validateBody(createSaleSchema, payload);
      assert.equal(result.success, false);
    });

    it('rejects invalid date string', () => {
      const payload = {
        date: 'invalid-date',
        skuId: 'sku-123',
        qty: 1,
        channel: 'OFFLINE',
      };
      const result = validateBody(createSaleSchema, payload);
      assert.equal(result.success, false);
    });
  });

  describe('createPurchaseSchema', () => {
    it('passes with valid purchase payload', () => {
      const payload = {
        date: '2026-10-07',
        skuId: 'sku-raw-1',
        qty: 100,
        unitPrice: 2500,
        supplier: 'CV Maju Jaya',
      };
      const result = validateBody(createPurchaseSchema, payload);
      assert.equal(result.success, true);
    });

    it('rejects negative unit price', () => {
      const payload = {
        date: '2026-10-07',
        skuId: 'sku-raw-1',
        qty: 10,
        unitPrice: -500,
      };
      const result = validateBody(createPurchaseSchema, payload);
      assert.equal(result.success, false);
    });
  });

  describe('createProductionSchema', () => {
    it('passes with valid production payload', () => {
      const payload = {
        date: '2026-10-07',
        outputSkuId: 'sku-prod-1',
        outputQty: 50,
        manualConsumptions: { 'kemasan-1': true },
      };
      const result = validateBody(createProductionSchema, payload);
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.outputQty, 50);
        assert.equal(result.data.manualConsumptions?.['kemasan-1'], true);
      }
    });

    it('rejects 0 output quantity', () => {
      const payload = {
        date: '2026-10-07',
        outputSkuId: 'sku-prod-1',
        outputQty: 0,
      };
      const result = validateBody(createProductionSchema, payload);
      assert.equal(result.success, false);
    });
  });
});
