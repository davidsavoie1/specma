# Specma

_Simple and composable validation_

Specma is a Javascript library that allows validating any value against a defined and composable spec.

> _Wait... what!? Another validation library? But why?_

- Validation based on **predicate functions** that return `true` or a custom reason
- Collection specs defined with the exact **same shape as the value**
- **Composable specs** with intuitive `and` and `or` operations
- **Async validation** with promises out of the box
- Easy **internationalization** of messages
- Built-in **spread (...)** validation
- Very **small footprint**

## Getting started

```
npm i specma
```

```js
import s from "specma";
import * as s from "specma";
import { validate } from "specma";
```

### Simple value

Specma can be used to validate any type of value, not just objects. The simplest spec is a predicate function that returns `true`/`false`.

```js
const spec = (x) => typeof x === "number";

s.check(spec, 2); // true
s.check(spec, "2"); // "failed 'spec'"
```

Value is valid only if the predicate function returns `true`. Hence, to get a more useful reason for invalid values, simply return a reason instead of `false` with a short-circuit evaluation.

```js
const spec = (x) => typeof x === "number" || "must be a number";

s.check(spec, "2"); // "must be a number"
```

Return value can be anything other than `true`: a simple reason string, a key to a lookup table, a number, an object... This allows easy internationalization.

```js
const spec = (x) =>
  typeof x === "number" || {
    en: "must be a number",
    fr: "doit être un nombre",
  };

s.check(spec, "2"); // { en: 'must be a number', fr: 'doit être un nombre' }
```

Async validation just works out of the box.

```js
async function spec(x) {
  return (await checkIsUnique(x)) || "must be unique";
}

s.check(spec, "2").then((res) => console.log(res)); // "must be unique"
```

A spec can be composed of many predicate functions by using `and` or `or`.

```js
const number = (x) => typeof x === "number" || "must be a number";
const isAnswerToTheUniverse = (x) => x === 42 || "is not the answer";

const spec = s.and(number, isAnswerToTheUniverse);

s.check(spec, 2); // "is not the answer"
```

### Collection

## API - Validation

### `validate`

### `check`

### `isValid`

### `conform`

## API - Specs

### `and`

### `or`

### `spread`

### `pair`

## API - Selection

### `select`

### `opt`
