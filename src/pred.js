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
  const realPreds = preds.map((pred) => (isFunc(pred) ? pred : () => true));
  if (realPreds.length <= 1) return realPreds[0];

  function combinedPred(...args) {
    const results = realPreds.map((pred) => validatePred(pred, ...args));

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
  }

  /* Set the arity of the function based on the max arity of predicates. */
  const maxLength = realPreds.reduce(
    (acc, pred) => Math.max(acc, pred.length),
    0
  );

  Object.defineProperty(combinedPred, "length", { value: maxLength });

  return combinedPred;
}
