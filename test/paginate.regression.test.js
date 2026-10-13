import test from "node:test";
import assert from "node:assert/strict";

import { paginate } from "../src/paginate.js";

const rows = (n) => Array.from({ length: n }, (_, i) => ({ id: i }));

const walk = (items, limit, cursor = 0) => {
  const seen = [];
  let calls = 0;
  while (cursor !== null) {
    const { page, nextCursor } = paginate(items, { limit, cursor });
    seen.push(...page.map((r) => (r === undefined ? r : r.id)));
    cursor = nextCursor;
    calls += 1;
    if (calls > 10000) {
      throw new Error("walk did not terminate");
    }
  }
  return { seen, calls };
};

test("limit: 0 is rejected instead of looping forever", () => {
  assert.throws(() => paginate(rows(5), { limit: 0 }), TypeError);
});

test('limit: "0" is rejected instead of looping forever', () => {
  assert.throws(() => paginate(rows(5), { limit: "0" }), TypeError);
});

test("a full page that ends at items.length is the last page", () => {
  const { page, nextCursor } = paginate(rows(4), { limit: 2, cursor: 2 });
  assert.deepEqual(
    page.map((r) => r.id),
    [2, 3],
  );
  assert.equal(nextCursor, null);
});

test("walking n rows takes exactly ceil(n / limit) calls", () => {
  assert.equal(walk(rows(4), 2).calls, 2);
  assert.equal(walk(rows(6), 3).calls, 2);
  assert.equal(walk(rows(7), 2).calls, 4);
  assert.equal(walk(rows(9), 9).calls, 1);
});

test("1001 rows in pages of 7 visits everything in 143 calls", () => {
  const { seen, calls } = walk(rows(1001), 7);
  assert.equal(calls, 143);
  assert.equal(seen.length, 1001);
  assert.equal(seen[0], 0);
  assert.equal(seen[1000], 1000);
});

test("limit and cursor are validated with a TypeError", () => {
  for (const limit of ["5", Infinity, -Infinity, NaN, null, 2.5, -1, 0, "0", true, {}]) {
    assert.throws(() => paginate(rows(3), { limit }), TypeError, `limit ${String(limit)}`);
  }
  for (const cursor of [-1, 1.5, NaN, null, "3", "0", -Infinity, true, {}]) {
    assert.throws(() => paginate(rows(3), { limit: 2, cursor }), TypeError, `cursor ${String(cursor)}`);
  }
});

test("undefined limit and cursor fall back to their defaults", () => {
  const items = rows(25);
  assert.equal(paginate(items).page.length, 10);
  assert.equal(paginate(items, { limit: undefined }).page.length, 10);
  assert.equal(paginate(items, { limit: 5, cursor: undefined }).page[0].id, 0);
});

test("undefined rows are preserved and the input is not mutated", () => {
  const items = [{ id: 0 }, undefined, { id: 2 }, undefined, { id: 4 }];
  const before = items.slice();
  const { page, nextCursor } = paginate(items, { limit: 2 });
  assert.equal(page[1], undefined);
  assert.equal(nextCursor, 2);
  assert.equal(items.length, before.length);
  assert.equal(items[0], before[0]);
  assert.equal(items[1], before[1]);
  assert.equal(items[4], before[4]);
});

test("empty list and cursor past the end end immediately", () => {
  assert.deepEqual(walk([], 3), { seen: [], calls: 1 });
  assert.deepEqual(paginate(rows(5), { limit: 3, cursor: 5 }).nextCursor, null);
  assert.equal(walk(rows(5), 3).calls, 2);
});
