# Getting started

```
npm install specma
```

```js
import * as s from "specma";
/* or */
import { validate } from "specma";
```

## About the examples

Specma offers a few different ways of doing validation :

- `validate` returns an object like `{ valid: false, reason: "is invalid", promise: <Promise>, ... }`, where `promise` will resolve to another valid or invalid result of the same shape;
- `check` returns either `true` when valid, a reason when invalid or a promise of those results;
- `conform` will return the value when valid, a promise of the value when async and throw an error when invalid;
- `isValid` will return `true` or `false` or a promise of those results.

Additionally, each method can be used with a callback as the last argument to standardize sync and async validation alike (more details in the [API section](/api#validation)). To demonstrate usage for both sync and async validation in this _Getting started_ section, `check` will be used with a logging function as callback. A `wait` utility function might also be used to demonstrate async delay.

```js
const log = (x) => console.log(x);
const wait = (ms) => new Promise((resolve) => setTimeout(() => resolve(), ms));

check(spec, value, {}, log);
```

## Predicate spec

Specma can be used to validate any type of value, not just objects. The simplest spec is a **predicate function** that returns `true` only when valid.

```js
s.check((x) => x === 42, 2, {}, log); // "is invalid"
```

If a **named function** is used as predicate spec, the default invalid reason will use its name.

```js
const number = (x) => typeof x === "number";

s.check(number, 2, {}, log); // true
s.check(number, "2", {}, log); // "failed 'number'"
```

Although slightly more precise, this invalid reason is still pretty vague. However, since value is valid only if the predicate function returns exactly `true`, we can return a reason instead of `false` by using **short-circuit evaluation**.

```js
const number = (x) => typeof x === "number" || "must be a number";

s.check(number, "2", {}, log); // "must be a number"
```

Returned reason can be **anything other than `true`**: a simple reason string, a key to a lookup table, a number, an object... This allows easy internationalization.

```js
const number = (x) =>
  typeof x === "number" || {
    en: "must be a number",
    fr: "doit être un nombre",
  };

s.check(number, "2", {}, log); // { en: 'must be a number', fr: 'doit être un nombre' }
```

**Configurable predicate** functions can simplify common patterns.

```js
const gt = (min) => (x) => x > min || `must be greater than ${min}`;

s.check(gt(10), 7, {}, log); // "must be greater than 10"
```

Predicate function will be considered invalid if a **runtime error** would normally occur. In this case, a warning will be displayed in the console so that predicate can be improved to prevent such errors.

```js
const minLength = (min) => (x) =>
  x.length >= min || `must have a length of at least ${min}`;

s.check(minLength(2), [1, 2, 3], {}, log); // true
s.check(minLength(2), "foo", {}, log); // true

/* Regularly invalid */
s.check(minLength(2), ["foo"], {}, log); // "must have a length of at least 2"

/* Runtime error invalid */
s.check(minLength(2), null, {}, log); // "is invalid"
```

**Async** validation just works out of the box!

```js
async function answerToTheUniverse(x) {
  await wait(400);
  return x === 42 || "is not the answer";
}

s.check(answerToTheUniverse, 37, {}, log);
// Promise {<pending>}
// "is not the answer"
```

A spec can be **composed** of many predicate functions by using `and` or `or`, seamlessly combining async and regular functions. Note that if the answer can be determined synchronously, async validation won't even be considered and result will be returned immediately.

```js
async function answerToTheUniverse(x) {
  await wait(400);
  return x === 42 || "is not the answer";
}

const number = (x) => typeof x === "number" || "must be a number";
const string = (x) => typeof x === "string" || "must be a string";

const spec = s.or(string, s.and(number, answerToTheUniverse));

s.check(spec, "2", {}, log); // true
s.check(spec, false, {}, log); // "must be a string"

s.check(spec, 2, {}, log);
// Promise {<pending>}
// "is not the answer"

s.check(spec, 42, {}, log);
// Promise {<pending>}
// true
```

If **multiple async** predicates are combined, a **race** will be initiated where the fastest determining result will prevail and others will be discarded.

```js
const asyncValid = () => wait(1500).then(() => true);
const asyncInvalid = () => wait(400).then(() => "is invalid async");

/* Result is returned after 400 ms only,
 * since invalid result resolved first, invalidating the entire `and`. */
s.check(s.and(asyncValid, asyncInvalid), 42, {}, log);
// Promise {<pending>}
// "is invalid async"

/* Result is returned after 1500 ms,
 * since `or` is waiting for the first valid result, which comes later. */
s.check(s.or(asyncValid, asyncInvalid), 42, {}, log);
// Promise {<pending>}
// "is invalid async"
```

## Collection

Here's what makes Specma shine! Documentation is coming soon...

## Real life

Here's an example of real-life complex document validation that makes use of most of the power of Specma. It's this kind of scenario that led to the creation of Specma in the first place.

```js
/* Add some code here... */
```

## Best practices

Here are some tips to get the most out of Specma.
