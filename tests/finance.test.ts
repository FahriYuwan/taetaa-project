import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveSaleHpp, resolveSaleProfit, parseRupiahNumber } from '../lib/finance';

describe('Finance Domain Calculations', () => {
  describe('resolveSaleHpp', () => {
    it('prioritizes totalHpp when totalHpp > 0', () => {
      const sale = {
        qty: 2,
        totalHpp: 50000,
        hpp: 20000,
      };
      const result = resolveSaleHpp(sale, 15000);
      assert.equal(result, 50000);
    });

    it('falls back to hpp when totalHpp is 0 or undefined', () => {
      const sale = {
        qty: 3,
        totalHpp: 0,
        hpp: 30000,
      };
      const result = resolveSaleHpp(sale, 10000);
      assert.equal(result, 30000);
    });

    it('falls back to qty * avgCost when neither totalHpp nor hpp is present', () => {
      const sale = {
        qty: 4,
        totalHpp: 0,
        hpp: 0,
      };
      const result = resolveSaleHpp(sale, 12500);
      assert.equal(result, 50000);
    });

    it('handles zero qty or zero avgCost safely', () => {
      const sale = { qty: 0 };
      const result = resolveSaleHpp(sale, 10000);
      assert.equal(result, 0);
    });
  });

  describe('resolveSaleProfit', () => {
    it('uses stored laba when explicitly provided and non-zero', () => {
      const sale = {
        qty: 1,
        laba: 25000,
      };
      const result = resolveSaleProfit(sale, 100000, 70000);
      assert.equal(result, 25000);
    });

    it('calculates netRevenue - saleHpp when laba is 0 or undefined', () => {
      const sale = {
        qty: 1,
        laba: 0,
      };
      const result = resolveSaleProfit(sale, 100000, 70000);
      assert.equal(result, 30000);
    });

    it('handles negative profit (loss) correctly', () => {
      const sale = { qty: 1 };
      const result = resolveSaleProfit(sale, 50000, 70000);
      assert.equal(result, -20000);
    });
  });

  describe('parseRupiahNumber', () => {
    it('correctly parses Indonesian dot-separated thousands amounts', () => {
      assert.equal(parseRupiahNumber('120.000'), 120000);
      assert.equal(parseRupiahNumber('10.000'), 10000);
      assert.equal(parseRupiahNumber('7.800'), 7800);
      assert.equal(parseRupiahNumber('1.200'), 1200);
      assert.equal(parseRupiahNumber('102.200'), 102200);
      assert.equal(parseRupiahNumber('45.000'), 45000);
      assert.equal(parseRupiahNumber('57.200'), 57200);
      assert.equal(parseRupiahNumber('1.250.000'), 1250000);
    });

    it('correctly parses plain numbers and currency prefixed strings', () => {
      assert.equal(parseRupiahNumber('10'), 10);
      assert.equal(parseRupiahNumber('0'), 0);
      assert.equal(parseRupiahNumber('Rp 120.000'), 120000);
      assert.equal(parseRupiahNumber('-57.200'), -57200);
      assert.equal(parseRupiahNumber('(10.000)'), -10000);
    });

    it('handles decimal formats gracefully', () => {
      assert.equal(parseRupiahNumber('120.000,50'), 120000.5);
      assert.equal(parseRupiahNumber('120,000'), 120000);
      assert.equal(parseRupiahNumber('120,000.50'), 120000.5);
      assert.equal(parseRupiahNumber('0.5'), 0.5);
      assert.equal(parseRupiahNumber(null), 0);
      assert.equal(parseRupiahNumber(''), 0);
    });
  });
});
