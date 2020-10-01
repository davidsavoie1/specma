import * as R from "ramda";
import {
  isPred,
  typeOf,
  isPath,
  getKeys,
  mergePaths,
  isSpec,
  isColl,
  isPromise,
  isObj,
} from "./util";
import { getPred, validatePred } from "./pred";
import { findMissingPath, select } from "./selection";
import { extractSpredSpec, getKeySpec } from "./spread";

const hasNot = R.complement(R.has);

/* Returns `true`, `false` or a promise that resolves to these values. */
export function isValid(...args) {
  return interpretIsValid(check(...args));
}

function interpretIsValid(ans) {
  if (ans === true) return true;
  if (isPromise(ans)) return ans.then(interpretIsValid);
  return false;
}

/* Return value if valid, throw error if invalid
 * or a promise that will do so. */
export function conform(spec, value, options) {
  return interpretConform(check(spec, value, options), value);
}

function interpretConform(ans, value) {
  if (ans === true) return value;
  if (isPromise(ans))
    return ans.then((promised) => interpretConform(promised, value));
  throw new Error(ans);
}

/* Return `true` if valid, error reason if invalid
 * or a promise that will return those. */
export function check(...args) {
  return interpretCheck(validate(...args));
}

function interpretCheck({ valid, promise, reason, path = [] }) {
  if (valid === null) return promise.then(interpretCheck);
  if (valid) return true;

  const key = path.join(".");
  if (!key) return reason;

  const stringified = isObj(reason) ? JSON.stringify(reason) : reason;
  const message = `'${key}' ${stringified}`;
  return message;
}

/* Return an object of shape
 * {
 *   valid: <true|false|null>
 *   reason: <any>
 *   promise: <promise>
 *   path: [<key>]
 *   value: <any>
 * } */
export function validate(
  spec,
  value,
  { required = {}, context, select: sel = false } = {}
) {
  const selection = createSelection({ selection: sel, spec, required });
  const prunedValue = selection ? select(selection, value) : value;

  if (!isSpec(spec))
    throw new TypeError("spec must be a collection or a predicate");

  const result = _validate(spec, prunedValue, { required, context });

  return R.pipe(
    /* Associate `value` if it doesn't have ont or if valid result */
    R.when(
      R.either(hasNot("value"), R.prop("valid")),
      R.assoc("value", prunedValue)
    ),
    /* Always return a `promise` key */
    R.assoc("promise", result.promise || Promise.resolve(result))
  )(result);
}

function _validate(spec, value, { required = {}, context } = {}) {
  /* If spec is a predicate function, return its validation result. */
  if (isPred(spec)) {
    return validatePred(spec, value, context);
  }

  /* Otherwise, ensure value is of same type as colleciton spec. */
  if (typeOf(spec) !== typeOf(value)) {
    return {
      valid: false,
      reason: `must be of type '${typeOf(spec)}'`,
    };
  }

  /* If there are keys requirements, check them on the value (not the pred). */
  const missingPath = findMissingPath(required, value);
  if (isPath(missingPath)) {
    return {
      valid: false,
      reason: "is required",
      path: missingPath,
    };
  }

  /* Validate all entries, including attached predicate and spread specs. */
  return validateEntries(spec, value, context);
}

function createSelection({ selection: sel, spec, required }) {
  if (!sel) return undefined;
  if (isColl(sel)) return sel;
  return [spec, required].filter(isColl).reduce(R.mergeDeepRight, {});
}

function validateEntries(spec, value, context) {
  const response = interpretEntriesResults(
    R.chain(
      (entry) => validateEntry(entry, value, context),
      expandEntries(spec, value)
    ),
    value
  );

  /* Remove empty path and associate global value when valid */
  return R.pipe(
    R.when(R.propSatisfies(R.isEmpty, "path"), R.dissoc("path")),
    R.when(R.prop("valid"), R.assoc("value", value))
  )(response);
}

/* Return all entries of a collection.
 * Append [undefined, pred] if spec has an attached predicate.
 * Append the spread spec on all value keys not present in the collection spec. */
function expandEntries(spec, value) {
  const pred = getPred(spec);
  const [spread, declaredEntries] = extractSpredSpec(spec);

  let allEntries = declaredEntries;
  if (pred) allEntries.push([undefined, pred]);

  if (!spread) return allEntries;

  const valueKeys = getKeys(value);
  const specKeys = declaredEntries.map(([key]) => key);
  const undeclaredKeys = R.difference(valueKeys, specKeys);
  const spreadEntries = undeclaredKeys.map((key) => [key, spread]);

  allEntries.push(...spreadEntries);
  return allEntries;
}

function interpretEntriesResults(results = [], value) {
  /* If all entries are already valid, return valid result. */
  const allValid = R.all(
    R.pathSatisfies(R.equals(true), [1, "valid"]),
    results
  );
  if (allValid) return { valid: true, value };

  /* If one of the branches is already invalid, return it with its path */
  const invalidEntry = results.find(([, ans]) => R.propEq("valid", false, ans));
  if (invalidEntry) {
    const [key, { reason, path, value: entryValue }] = invalidEntry;
    return {
      valid: false,
      reason,
      path: mergePaths(key, path),
      value: entryValue,
    };
  }

  /* Otherwise, return a new promise that will resolve at the first invalid
   * result or when all promises have resolved. */
  return {
    valid: null,
    promise: new Promise((resolve) => {
      const promisedEntries = results.filter(R.hasPath([1, "promise"]));

      /* As soon as a promise resolves to an invalid result,
       * return it with its path. */
      promisedEntries.forEach(([key, { promise }]) =>
        promise.then((ans) => {
          if (ans.valid !== true)
            resolve({ ...ans, path: mergePaths(key, ans.path) });
        })
      );

      /* Wait until all promises have resolved, then put these entry results
       * through the interpretation process again. */
      const promises = promisedEntries.map(R.path([1, "promise"]));
      Promise.all(promises).then((resolvedResults) => {
        const resolvedEntries = resolvedResults.map((res, idx) => [
          promisedEntries[idx][0],
          res,
        ]);
        resolve(interpretEntriesResults(resolvedEntries, value));
      });
    }),
  };
}

/* Validate a branch of a value against a spec entry. */
function validateEntry([key, spec], value, context) {
  if (R.isNil(key)) return [[key, validate(spec, value, { context })]];

  if (!R.has(key, value)) return [[key, { valid: true }]];

  const subContext = R.prop(key, context);
  const valueRes = validate(spec, value[key], { context: subContext });
  const keySpec = getKeySpec(spec);

  if (!keySpec) return [[key, valueRes]];

  const keyRes = validate(keySpec, key, { context: subContext });
  return [
    [key, valueRes],
    [key, keyRes],
  ];
}
