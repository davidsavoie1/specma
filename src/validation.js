import { toSpec } from "./collSpec";
import { getMessage } from "./messages";
import { isResult, resultsRace } from "./results";
import { typeOf } from "./typeOf";
import {
  entries,
  getPath,
  isColl,
  isPromise,
  isSpec,
  mergePaths,
} from "./util";

/* Return a result object of shape
 * {
 *   valid: true|false|null
 *   promise,
 *   reason,
 *   value,
 *   failedValue,
 *   failedPath,
 *  } */
export function _validate(
  specable,
  value,
  { getFrom: argGetFrom, key, path, rootValue } = {}
) {
  const enhanceArgs = { path, value };

  /* Always valid if not a usable spec */
  if (!isSpec(specable)) return enhanceResult({ valid: true }, enhanceArgs);

  /* Immediately validate collection type */
  if (isColl(specable)) {
    const collType = typeOf(specable);
    if (typeOf(value) !== collType)
      return enhanceResult(
        { valid: false, reason: `must be of type ${collType}` },
        enhanceArgs
      );
  }

  /* Transform into a Map spec */
  const spec = toSpec(specable);

  /* Create value navigation function to act as variable context */
  const getFrom =
    argGetFrom ||
    function (relPath) {
      return getFromValue(relPath, path, rootValue);
    };

  /* Check own predicate spec */
  const pred = spec.get(undefined);
  const predResult = validatePred(pred, value, getFrom, { key });

  if (!isColl(specable) || predResult.valid === false)
    return enhanceResult(predResult, enhanceArgs);

  /* If spec is a collection one, validate entries, combined with own predicate result */
  const results = entries(value).reduce(
    (acc, [subKey, subVal]) => {
      const subSpec = spec.get(subKey) || spec.get("...");
      if (!isSpec(subSpec)) return acc;

      const result = _validate(subSpec, subVal, {
        key: subKey,
        path: mergePaths(path, subKey),
        rootValue: rootValue || value,
      });
      return [...acc, result];
    },
    [predResult]
  );

  return enhanceResult(interpretCollValidation(results), enhanceArgs);
}

export function validatePred(pred, value, getFrom, options) {
  const ans = !pred || failSafeCheck(pred, value, getFrom, options);
  return interpretPredAnswer(ans);
}

/* Check a value against a predicate.
 * If an error occurs during validation, returns false without throwing. */
function failSafeCheck(pred, ...args) {
  const defaultReason = pred.name
    ? `failed '${pred.name}'`
    : getMessage("isInvalid");
  try {
    return pred(...args) || defaultReason;
  } catch (err) {
    /* eslint-disable-next-line no-console */
    console.warn(
      `Failed '${pred.name}' pred because of runtime error:`,
      err.message
    );
    return defaultReason;
  }
}

function enhanceResult(res, { path, value }) {
  const enhanced =
    res.valid === false
      ? {
          ...res,
          failedPath: res.failedPath || path,
          failedValue: res.failedValue || value,
          value,
        }
      : res;

  const promise = res.promise
    ? res.promise.then((promised) => enhanceResult(promised, { value }))
    : Promise.resolve(enhanced);

  return { ...enhanced, promise };
}

function interpretPredAnswer(ans) {
  /* If answer is itself already a result (tagged as one), return it. */
  if (isResult(ans)) return ans;

  if (ans === true) return { valid: true };

  if (isPromise(ans))
    return {
      valid: null,
      promise: ans.then((promisedAns) => interpretPredAnswer(promisedAns)),
    };

  return { valid: false, reason: ans || getMessage("isInvalid") };
}

function interpretCollValidation(results = []) {
  /* Any is invalid */
  const firstInvalid = results.find(
    ({ valid }) => ![null, true].includes(valid)
  );
  if (firstInvalid) return firstInvalid;

  /* All valid synchronously */
  if (results.every(({ valid }) => valid === true)) return { valid: true };

  /* Some promises */
  const unresolvedResults = results.filter(({ valid }) => valid === null);
  return {
    valid: null,
    promise: resultsRace(unresolvedResults).then((promisedResult) => {
      return interpretCollValidation([promisedResult]);
    }),
  };
}

/* Given a value and a current path, return the sub value
 * at a path relative to current one. */
function getFromValue(relPath, currPath = [], value) {
  const newPath = relPath.split("/").reduce((acc, move) => {
    if ([null, undefined, "", "."].includes(move)) return acc;

    if (move.startsWith("..")) return acc.slice(0, -1);

    const index = parseInt(move, 10);
    return [...acc, isNaN(index) ? move : index];
  }, currPath);
  return getPath(newPath, value);
}
