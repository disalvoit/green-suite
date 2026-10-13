import test from "node:test";
import assert from "node:assert/strict";

import { paginate } from "../src/paginate.js";

const rows = (n) => Array.from({ length: n }, (_, i) => ({ id: i }));

test("the default limit is ten", () => {
  const items = rows(25);
  const { page } = paginate(items);
  assert.equal(page.length, 10);
  assert.deepEqual(page[0], { id: 0 });
});

test("an explicit cursor returns the window after it", () => {
  const items = rows(12);
  const { page, nextCursor } = paginate(items, { limit: 3, cursor: 2 });
  assert.deepEqual(
    page.map((r) => r.id),
    [2, 3, 4],
  );
  assert.equal(nextCursor, 5);
});

test("walking a short list with a small limit visits every row once", () => {
  const items = rows(7);
  const seen = [];
  let cursor = 0;
  let calls = 0;
  while (cursor !== null && calls < 20) {
    const { page, nextCursor } = paginate(items, { limit: 2, cursor });
    seen.push(...page.map((r) => r.id));
    cursor = nextCursor;
    calls += 1;
  }
  assert.deepEqual(seen, [0, 1, 2, 3, 4, 5, 6]);
  assert.equal(calls, 4);
});

test("an empty list returns an empty page and no cursor", () => {
  const { page, nextCursor } = paginate([], { limit: 5 });
  assert.deepEqual(page, []);
  assert.equal(nextCursor, null);
});

test("a cursor past the end returns an empty page and no cursor", () => {
  const { page, nextCursor } = paginate(rows(7), { limit: 4, cursor: 50 });
  assert.deepEqual(page, []);
  assert.equal(nextCursor, null);
});

test("a limit larger than the list returns the whole list", () => {
  const items = rows(4);
  const { page, nextCursor } = paginate(items, { limit: 100 });
  assert.equal(page.length, 4);
  assert.equal(nextCursor, null);
});

test("the returned page is a copy", () => {
  const items = rows(5);
  const { page } = paginate(items, { limit: 2 });
  page.push({ id: 999 });
  assert.equal(items.length, 5);
  assert.equal(items[5], undefined);
});

test("the input array is not mutated", () => {
  const items = rows(9);
  const before = JSON.stringify(items);
  paginate(items, { limit: 4, cursor: 3 });
  assert.equal(JSON.stringify(items), before);
});

test("items are handed back by reference, not copied", () => {
  const first = { id: 1, nested: { deep: true } };
  const { page } = paginate([first], { limit: 1 });
  assert.equal(page[0], first);
});

test("a non-array is rejected", () => {
  for (const bad of [null, undefined, "abc", 42, { length: 2 }]) {
    assert.throws(() => paginate(bad), TypeError, `expected a TypeError for ${String(bad)}`);
  }
});
