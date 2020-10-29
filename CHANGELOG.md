# Changelog

## [Unreleased]

### Break

### Grow

### Fix

### Deprecate

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
