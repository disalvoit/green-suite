# What main does

Measured before any agent touched the repository. 100 trials per case, all 100
identical:

| case | result | reproduces |
| --- | --- | --- |
| exactly-divisible traversal (n = limit x k) | takes `n / limit + 1` calls, the last one empty | 100/100 |
| `limit: 0` | never terminates - 10 000 calls in the guard, cursor still `0` | 100/100 |
| `limit: -1` | never terminates - the cursor walks backwards off the array | 100/100 |
| `cursor: -1` | no `TypeError`, returns an empty page | 100/100 |
| `cursor: 1.5` | no `TypeError`, returns a valid-looking page | 100/100 |
| `limit: "5"` | no `TypeError`, returns `nextCursor: "05"` | 100/100 |

`npm test` on main: **10 tests, 10 pass, 0 fail**. The suite is green and none of
the rows above is covered by it. A green suite is not evidence that the bug is
fixed.
