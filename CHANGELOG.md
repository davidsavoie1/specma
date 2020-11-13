# Changelog

## [Unreleased]

### Break

### Grow

- Allow customization of built-in reason messages.
- Append validation result to `conform` `error.details`.

### Fix

- `createSelection` fails with `Cannot create property 'arrayMerge' of '1'`

### Deprecate

---

## [2.1.4] = 2020-11-09

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
