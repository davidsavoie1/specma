import { fromSpec, toSpec } from "./collSpec.js";
import { PRED, RESULT } from "./constants.js";
import { resultsRace } from "./results.js";
import { identity, isColl, isFunc, isPromise } from "./util.js";

const DEFAULT_INVALID_MSG = "is invalid";

export function getPred(spec) {
  if (isFunc(spec)) return spec;
  return spec && spec[PRED];
}

export function setPred(pred, coll) {
  if (!isColl(coll)) return coll;
  const spec = toSpec(coll);

  const currPred = spec.get(undefined);
  spec.set(undefined, currPred ? combinePreds(currPred, pred) : pred);

  return fromSpec(spec, coll);
}

export function combinePreds(...preds) {
  if (preds.length <= 1) return preds[0];

  return function combinedPred(value, context, key) {
    const results = preds
      .filter(isFunc)
      .map((pred) => validatePred(pred, value, context, key));

    /* Any is invalid */
    const firstInvalid = results.find(
      ({ valid }) => ![null, true].includes(valid)
    );
    if (firstInvalid) {
      if (firstInvalid[RESULT]) return firstInvalid;
      return firstInvalid.reason;
    }

    /* All valid synchronously */
    if (results.every(({ valid }) => valid === true)) return true;

    /* Some promises */
    const unresolvedResults = results.filter(({ valid }) => valid === null);
    return resultsRace(unresolvedResults).then((res) => {
      if (res[RESULT]) return res;
      return res.valid === true || res.reason;
    });
  };
}

export function validatePred(pred, value, context, key, enhanceResult) {
  return interpretAnswer(
    failSafeCheck(pred, value, context, key),
    enhanceResult
  );
}

function interpretAnswer(ans, enhanceResult = identity) {
  /* If answer is itself already a result (tagged as one), return it. */
  if (ans[RESULT]) return enhanceResult(ans);

  if (isPromise(ans))
    return {
      valid: null,
      promise: ans.then((promisedAns) =>
        interpretAnswer(promisedAns, enhanceResult)
      ),
    };

  const res =
    ans === true
      ? { valid: true }
      : { valid: false, reason: ans || DEFAULT_INVALID_MSG };
  return enhanceResult({ ...res, promise: Promise.resolve(res) });
}

/* Check a value against a predicate.
 * If an error occurs during validation, returns false without throuwing. */
function failSafeCheck(pred, value, context, key) {
  const defaultReason = pred.name
    ? `failed '${pred.name}'`
    : DEFAULT_INVALID_MSG;
  try {
    return pred(value, context, key) || defaultReason;
  } catch (err) {
    console.warn(`Error caught in '${pred.name}' pred:`, err.message); // eslint-disable-line no-console
    return defaultReason;
  }
}
