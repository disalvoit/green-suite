import test from "node:test";
import assert from "node:assert/strict";

import { paginate } from "../src/paginate.js";

const rows = (n) => Array.from({ length: n }, (_, i) => ({ id: i }));

function walk(items, options = {}) {
  const seen = [];
  let cursor = options.cursor === undefined ? 0 : options.cursor;
  let calls = 0;
  while (cursor !== null) {
    const { page, nextCursor } = paginate(items, { ...options, cursor });
    seen.push(...page);
    cursor = nextCursor;
    calls += 1;
    assert.ok(calls <= 10000, "the walk never ends");
  }
  return { seen, calls };
}

test("bug 1: a limit of zero or \"0\" is rejected instead of looping", () => {
  for (const bad of [0, "0", -1, -10]) {
    assert.throws(
      () => paginate(rows(5), { limit: bad }),
      TypeError,
      `expected a TypeError for limit ${JSON.stringify(bad)}`,
    );
  }
});

test("bug 2: a full page at the end of the list yields nextCursor null", () => {
  const items = rows(6);
  const { page, nextCursor } = paginate(items, { limit: 3, cursor: 3 });
  assert.equal(page.length, 3);
  assert.equal(nextCursor, null);
});

test("bug 2: walking an exact multiple of the limit stops with no extra call", () => {
  const items = rows(6);
  let cursor = 0;
  let calls = 0;
  while (cursor !== null) {
    const { nextCursor } = paginate(items, { limit: 3, cursor });
    cursor = nextCursor;
    calls += 1;
    assert.ok(calls <= 10, "the walk never ends");
  }
  assert.equal(calls, 2);
});

test("bug 3: a negative or fractional cursor is rejected", () => {
  const items = rows(10);
  for (const bad of [-1, 1.5]) {
    assert.throws(
      () => paginate(items, { cursor: bad }),
      TypeError,
      `expected a TypeError for cursor ${String(bad)}`,
    );
  }
});

test("core: walking n rows takes exactly ceil(n / limit) calls", () => {
  for (const [n, limit] of [
    [7, 2],
    [6, 3],
    [1, 1],
    [10, 3],
    [1001, 7],
  ]) {
    const { seen, calls } = walk(rows(n), { limit });
    assert.equal(seen.length, n, `saw ${seen.length} of ${n} rows (limit ${limit})`);
    assert.equal(calls, Math.ceil(n / limit), `walk of ${n} rows with limit ${limit}`);
  }
});

test("edge: 1001 rows in pages of 7 arrive in order, exactly once", () => {
  const items = rows(1001);
  const { seen, calls } = walk(items, { limit: 7 });
  assert.equal(calls, Math.ceil(1001 / 7));
  assert.deepEqual(
    seen.map((r) => r.id),
    items.map((r) => r.id),
  );
});

test("edge: a limit that arrives as a string is a TypeError", () => {
  for (const bad of ["5", "0", "10"]) {
    assert.throws(
      () => paginate(rows(5), { limit: bad }),
      TypeError,
      `expected a TypeError for limit ${JSON.stringify(bad)}`,
    );
  }
});

test("edge: limit must be a finite integer >= 1", () => {
  for (const bad of [0, -1, 2.5, Infinity, -Infinity, NaN, null, true, {}, []]) {
    assert.throws(
      () => paginate(rows(5), { limit: bad }),
      TypeError,
      `expected a TypeError for limit ${JSON.stringify(bad)}`,
    );
  }
  assert.equal(paginate(rows(5), { limit: undefined }).page.length, 5);
});

test("edge: cursor must be a non-negative integer", () => {
  const items = rows(10);
  for (const bad of [-1, 1.5, NaN, null, "0", "abc", Infinity, -Infinity, true, {}, []]) {
    assert.throws(
      () => paginate(items, { cursor: bad }),
      TypeError,
      `expected a TypeError for cursor ${String(bad)}`,
    );
  }
  assert.equal(paginate(items, { cursor: undefined }).page[0].id, 0);
  assert.equal(paginate(items).page[0].id, 0);
});

test("edge: a cursor at or past the end is legal and ends the walk", () => {
  const items = rows(10);
  for (const cursor of [10, 50, 1000]) {
    const { page, nextCursor } = paginate(items, { limit: 4, cursor });
    assert.deepEqual(page, []);
    assert.equal(nextCursor, null);
  }
});

test("edge: an empty list ends the walk on the first call", () => {
  const { seen, calls } = walk([], { limit: 5 });
  assert.deepEqual(seen, []);
  assert.equal(calls, 1);
});

test("edge: rows that are undefined pass through untouched", () => {
  const items = [undefined, 1, undefined];
  const first = paginate(items, { limit: 2 });
  assert.equal(first.page.length, 2);
  assert.equal(first.page[0], undefined);
  assert.equal(first.page[1], 1);
  assert.equal(first.nextCursor, 2);
  const second = paginate(items, { limit: 2, cursor: 2 });
  assert.equal(second.page.length, 1);
  assert.equal(second.page[0], undefined);
  assert.equal(second.nextCursor, null);
});

test("edge: neither a single call nor a full walk mutates the input", () => {
  const items = rows(9);
  const before = items.slice();
  paginate(items, { limit: 4, cursor: 3 });
  assert.deepEqual(items, before);
  walk(items, { limit: 2 });
  assert.deepEqual(items, before);
});

test("edge: the page is a new array; rows keep their identity", () => {
  const items = rows(5);
  const { page } = paginate(items, { limit: 3 });
  page.push({ id: 999 });
  assert.equal(items.length, 5);
  assert.equal(page[0], items[0]);
});
