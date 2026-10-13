# paginate

A zero-dependency windowed paginator: give it an array, get back a page and the
cursor for the next page.

```js
import { paginate } from "./src/paginate.js";

const { page, nextCursor } = paginate(items, { limit: 3, cursor: 6 });
```

## The contract

`paginate(items, options)` returns `{ page, nextCursor }`.

- `page` is a **new array** holding `items` from index `cursor`, up to `limit`
  rows. Rows are handed back by reference; the input array is never mutated.
- `nextCursor` is the cursor of the next window, or **`null` when the page you
  just received is the last one**. "Last" means there is nothing after it — not
  "this page happens to be full".
- `limit` is the number of rows per page. Default `10`. It must be a **finite
  integer >= 1**; anything else (including `0`, negatives, `2.5`, `"5"`,
  `Infinity`, `NaN`) is a `TypeError`.
- `cursor` is a **non-negative integer**. Default `0` when omitted or
  `undefined`. A cursor at or past `items.length` is legal and returns an empty
  page with `nextCursor: null`. Anything else (`-1`, `1.5`, `NaN`, `null`, a
  string) is a `TypeError`.
- `items` must be an array. Anything else is a `TypeError`.

A caller must be able to traverse any list exactly like this, and it must stop:

```js
let cursor = 0;
while (cursor !== null) {
  const { page, nextCursor } = paginate(items, { limit, cursor });
  consume(page);
  cursor = nextCursor;   // must reach null after the last row
}
```

The number of calls it takes to walk `n` rows is exactly `ceil(n / limit)`.

## Tests

```
npm test
```
