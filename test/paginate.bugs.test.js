import test from "node:test";
import assert from "node:assert/strict";

import { paginate } from "../src/paginate.js";

const rows = (n) => Array.from({ length: n }, (_, i) => ({ id: i }));

test("limit 0 throws TypeError", () => {
  assert.throws(() => paginate(rows(5), { limit: 0 }), TypeError);
});

test("limit '0' throws TypeError", () => {
  assert.throws(() => paginate(rows(5), { limit: "0" }), TypeError);
});

test("limit negative throws TypeError", () => {
  assert.throws(() => paginate(rows(5), { limit: -1 }), TypeError);
});

test("limit 2.5 throws TypeError", () => {
  assert.throws(() => paginate(rows(5), { limit: 2.5 }), TypeError);
});

test("limit '5' throws TypeError", () => {
  assert.throws(() => paginate(rows(5), { limit: "5" }), TypeError);
});

test("limit Infinity throws TypeError", () => {
  assert.throws(() => paginate(rows(5), { limit: Infinity }), TypeError);
});

test("limit NaN throws TypeError", () => {
  assert.throws(() => paginate(rows(5), { limit: NaN }), TypeError);
});

test("limit null throws TypeError", () => {
  assert.throws(() => paginate(rows(5), { limit: null }), TypeError);
});

test("cursor -1 throws TypeError", () => {
  assert.throws(() => paginate(rows(5), { cursor: -1 }), TypeError);
});

test("cursor 1.5 throws TypeError", () => {
  assert.throws(() => paginate(rows(5), { cursor: 1.5 }), TypeError);
});

test("cursor 'abc' throws TypeError", () => {
  assert.throws(() => paginate(rows(5), { cursor: "abc" }), TypeError);
});

test("cursor null throws TypeError", () => {
  assert.throws(() => paginate(rows(5), { cursor: null }), TypeError);
});

test("cursor NaN throws TypeError", () => {
  assert.throws(() => paginate(rows(5), { cursor: NaN }), TypeError);
});

test("walking exact n rows takes exactly ceil(n/limit) calls, no extra call", () => {
  const items = rows(10);
  const limit = 3;
  let cursor = 0;
  let calls = 0;
  while (cursor !== null) {
    const { page, nextCursor } = paginate(items, { limit, cursor });
    cursor = nextCursor;
    calls += 1;
  }
  assert.equal(calls, Math.ceil(10 / 3));
});

test("stress: 1001 rows in pages of 7", () => {
  const items = rows(1001);
  const limit = 7;
  let cursor = 0;
  let calls = 0;
  const seen = [];
  while (cursor !== null) {
    const { page, nextCursor } = paginate(items, { limit, cursor });
    seen.push(...page.map((r) => r.id));
    cursor = nextCursor;
    calls += 1;
  }
  assert.equal(calls, Math.ceil(1001 / 7));
  assert.deepEqual(seen, Array.from({ length: 1001 }, (_, i) => i));
});

test("string limit is rejected", () => {
  assert.throws(() => paginate(rows(5), { limit: "3" }), TypeError);
});

test("empty list returns empty page and null cursor", () => {
  const { page, nextCursor } = paginate([], { limit: 5 });
  assert.deepEqual(page, []);
  assert.equal(nextCursor, null);
});

test("undefined rows are handed back by reference", () => {
  const items = [undefined, { id: 1 }, undefined];
  const { page } = paginate(items, { limit: 2 });
  assert.equal(page[0], undefined);
  assert.equal(page[1], items[1]);
});

test("input array is not mutated during walk", () => {
  const items = rows(10);
  const before = JSON.stringify(items);
  let cursor = 0;
  while (cursor !== null) {
    const { page, nextCursor } = paginate(items, { limit: 3, cursor });
    cursor = nextCursor;
  }
  assert.equal(JSON.stringify(items), before);
});