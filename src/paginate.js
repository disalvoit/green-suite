/**
 * Windowed pagination over an in-memory array.
 *
 * The contract lives in README.md. Read it before changing this file.
 */
export function paginate(items, options = {}) {
  if (!Array.isArray(items)) {
    throw new TypeError("paginate: items must be an array");
  }

  const limit = options.limit === undefined ? 10 : options.limit;
  const cursor = options.cursor === undefined ? 0 : options.cursor;

  if (!Number.isInteger(limit) || limit < 1) {
    throw new TypeError("paginate: limit must be a finite integer >= 1");
  }
  if (!Number.isInteger(cursor) || cursor < 0) {
    throw new TypeError("paginate: cursor must be a non-negative integer");
  }

  const page = items.slice(cursor, cursor + limit);
  const nextCursor = cursor + limit < items.length ? cursor + limit : null;

  return { page, nextCursor };
}
