import { fromSpec, toSpec } from "./collSpec.js";
import { PRED } from "./constants.js";
import { isResult, resultsRace } from "./results.js";
import { isColl, isFunc } from "./util.js";
import { validatePred } from "./validation.js";

export function getPred(spec) {
  if (isFunc(spec)) return spec;
  return spec && spec[PRED];
}

/* Associate a predicate spec to a collection
 * by converting the collection to a standard Map spec,
 * combining the function with existing predicate,
 * then converting Map spec back into original collection type. */
export function setPred(pred, coll) {
  if (!isColl(coll)) return coll;
  const spec = toSpec(coll);

  const currPred = spec.get(undefined);
  spec.set(undefined, currPred ? combinePreds(currPred, pred) : pred);

  return fromSpec(spec, coll);
}

/* Combine multiple predicate specs into a single function,
 * racing for first invalid result when async. */
export function combinePreds(...preds) {
  if (preds.length <= 1) return preds[0];

  return function combinedPred(...args) {
    const results = preds
      .filter(isFunc)
      .map((pred) => validatePred(pred, ...args));

    /* Any is invalid */
    const firstInvalid = results.find(
      ({ valid }) => ![null, true].includes(valid)
    );
    if (firstInvalid) {
      if (isResult(firstInvalid)) return firstInvalid;
      return firstInvalid.reason;
    }

    /* All valid synchronously */
    if (results.every(({ valid }) => valid === true)) return true;

    /* Some promises */
    const unresolvedResults = results.filter(({ valid }) => valid === null);
    return resultsRace(unresolvedResults).then((res) => {
      if (isResult(res)) return res;
      return res.valid === true || res.reason;
    });
  };
}
