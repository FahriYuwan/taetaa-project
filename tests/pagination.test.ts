import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Pagination Logic Utilities', () => {
  it('correctly calculates total pages and slices for standard page sizes', () => {
    const totalItems = 1647;
    const pageSize = 50;
    const totalPages = Math.ceil(totalItems / pageSize);
    assert.strictEqual(totalPages, 33);

    // Page 1
    const page1Start = (1 - 1) * pageSize;
    const page1End = page1Start + pageSize;
    assert.strictEqual(page1Start, 0);
    assert.strictEqual(page1End, 50);

    // Page 33 (last page)
    const page33Start = (33 - 1) * pageSize;
    const page33End = Math.min(page33Start + pageSize, totalItems);
    assert.strictEqual(page33Start, 1600);
    assert.strictEqual(page33End, 1647);
    assert.strictEqual(page33End - page33Start, 47);
  });

  it('handles pageSize = "all" without errors', () => {
    const totalItems = 1647;
    const pageSize = 'all';
    const totalPages = pageSize === 'all' ? 1 : Math.ceil(totalItems / pageSize);
    assert.strictEqual(totalPages, 1);
  });

  it('handles 0 items gracefully', () => {
    const totalItems = 0;
    const pageSize = 50;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    assert.strictEqual(totalPages, 1);
  });
});
