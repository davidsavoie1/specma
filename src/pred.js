import { KEY_SPEC, SPREAD } from "./spread";
import { cloneSpec, isPred, isPromise } from "./util";

const PRED = Symbol("PRED");

/* Clone a collection spec and associate a pred to `PRED` symbol key */
export function assocPred(pred, collSpec) {
  const clone = cloneSpec(collSpec);
  clone[PRED] = pred;
  clone[SPREAD] = collSpec[SPREAD];
  clone[KEY_SPEC] = collSpec[KEY_SPEC];
  return clone;
}

export function getPred(spec) {
  if (isPred(spec)) return spec;
  return spec && spec[PRED];
}

export function validatePred(pred, value, context) {
  const result = interpretPredAnswer(
    failSafeCheck(pred, value, context),
    value
  );
  return result.valid === false ? { ...result, value } : result;
}

function interpretPredAnswer(ans, value) {
  if (ans === true) return { valid: true, value };
  if (isPromise(ans))
    return {
      valid: null,
      promise: ans.then((promisedAns) =>
        interpretPredAnswer(promisedAns, value)
      ),
    };
  return { valid: false, reason: ans };
}

/* Check a value against a predicate.
 * If an error occurs during validation, returns false without throuwing. */
function failSafeCheck(pred, value, context) {
  const defaultReason = pred.name ? `failed '${pred.name}'` : "is invalid";
  try {
    return pred(value, context) || defaultReason;
  } catch (err) {
    // console.warn(`Error caught in '${pred.name}' pred:`, err.message);
    return defaultReason;
  }
}
