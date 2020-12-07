# Changelog

## [UNRELEASED] -

### Break

### Grow

### Fix

- Exclude `undefined` props in selection;

### Deprecate

---

## [2.3.2] - 2020-11-26

### Break

### Grow

### Fix

- Consider spread in requirements;

### Deprecate

---

## [2.3.1] - 2020-11-23

### Break

### Grow

- Use external documentation site instead of only the README;

### Fix

- Compare type with strict equality `===` in `isColl`;

### Deprecate

---

## [2.3.0] - 2020-11-19

### Break

- Subvalues that are `undefined` are not validated. The `required` option should be used to ensure values are present. Otherwise, each spec had to be defined taking `undefined` into account.

### Grow

### Fix

### Deprecate

---

## [2.2.1] - 2020-11-16

### Break

### Grow

- Set arity on combined pred function based on argument pred functions. Allows checking arity before creating/passing `getFrom` function.
- Expose `validatePred` and `getPath` utility function.

### Fix

- Pass `options` to `key` pred.
- Pass `getFrom` instead of `goTo` to `_validate` in `or`.
- Always return promise on valid result.
- Ensure value is always attached to `validate` result.
- Properly reify arguments to `or` to avoid unpredictable bugs.

### Deprecate

---

## [2.2.0] - 2020-11-15

Still some breaking changes in this release, but it is stabilizing. The `context` that was provided to predicate spec functions was very brittle. It was nearly impossible to define a deeply nested context and most predicate functions had to know way more than they should in order to perform validation. Now, a `getFrom` helper function is passed as the second argument to predicate spec functions. It accepts a relative string path (similar to those used with `cd` command in CLIs) that points to another location in the value being validated.

This should favor a particuliar way of defining specs, where the parent that _should_ know about a particular constraint should be the one defining the spec for a nested value. Here's an example :

Let's say we have a list of choices. Taken individually, each choice could be any primitive value (string, number, boolean, etc.). However, the choices list itself is aware that there should be no duplicate choices; each choice doesn't know about this constraint. Although it would be possible to add this validation as a predicate function on the choices list itself, it might be better to define it on each individual choice for better error handling in forms, etc. This validation would be defined at the choices level however.

Moreover, the list of choices itself could be used in a parent value that provides context for what kind of choices are allowed. This restriction on type would then be defined at the parent level.

```js
/* Not concerned with unicity or specific type. Highly reusable. */
const primitive = s.or(number, string, boolean);

/* Not concerned about specific type, but ensures values are unique. Highly reusable. */
const noDuplicatesList = s.spread(
  s.and(primitive, function uniqueValue(x, getFrom) {
    const list = getFrom("..");
    return list.filter((item) => item === x).length <= 1 || "must be unique";
  })
);

/* Don't have to specify again that choices must be unique.
 * Add a constraint on list values based on another prop. */
const spec = {
  type: oneOf(["string", "number"]),
  choices: s.and(
    noDuplicatesList,
    s.spread(function choiceByType(choice, getFrom) {
      const type = getFrom("../../type");
      return typeof choice === type || `must be of type '${type}'`;
    })
  ),
};

/* Each choice will be a unique string value. */
const value = {
  type: "string",
  choices: ["foo", "bar"],
};
```

### Break

- Replace `context` with more flexible `getFrom` helper in predicate spec functions.
- Remove `pair` in favor of `key` to spec spread objects.
- Split `validate` and `_validate` to prevent former from being called with internal only params.

### Grow

- Add `key` spec creator on main API to replace `pair`.
- Allow customizing "is invalid" message

### Fix

- `or` didn't validate as expected

### Deprecate

---

## [2.1.5] - 2020-11-13

### Break

### Grow

- Allow customization of built-in reason messages.
- Append validation result to `conform` `error.details`.

### Fix

- `createSelection` fails with `Cannot create property 'arrayMerge' of '1'`

### Deprecate

---

## [2.1.4] - 2020-11-09

### Break

### Grow

### Fix

- Ensure a promise is always returned in the validation result

### Deprecate

---

## [2.1.3] = 2020-11-09

### Break

### Grow

### Fix

- Treat all types of functions (regular, generator, async, ...) as predicate specs

### Deprecate

---

## [2.1.2] - 2020-11-02

### Break

### Grow

### Fix

- `check` should always return stringified reason, even when no key

### Deprecate

---

## [2.1.0] - 2020-11-02

### Break

### Grow

- Do not compress output so that code is readable and can act as its own source map.

### Fix

### Deprecate

---

## [2.1.0] - 2020-11-02

### Break

### Grow

- Export only UMD and "modern" (`<script type="module">`) bundles, instead of UMD + CJS + Modules + Modern. Should still be importable from any project, but entry points may have changed and bundle size is considerably reduced.

### Fix

### Deprecate

- Remove source maps; they didn't point to any useful code and removing them makes for a much lighter package.

---

## [2.0.0] - 2020-10-28

This is a complete refactor of the internals. While the API did not change much from prior version, it did change a little. But since the library is most probably not used by anyone yet, and since I'm just getting used to open source development, I did not keep track of the API changes. For the next releases, changes will be better documented.

- Complete refactor from gathered knowledge
  - Standardize specs as Map objects internally
  - Reduce usage of Symbol constants
  - Use "..." key as spread even on arrays
  - Better use `Promise.all` to resolve validation races
- Use Microbundle instead of Rollup
- Remove Ramda dependency
- Expose helper and utility functions for outsude consumption (`getPred`, `getSpread`, `isOpt`, `typeOf`, `get`, ...)
