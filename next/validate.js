import { toSpec } from "./collSpec.js";
import { validatePred } from "./pred.js";
import { resultsRace } from "./results.js";
import { createSelection, findMissingPath, select } from "./selection.js";
import { typeOf } from "./typeOf.js";
import { entries, getPath, isFunc, isSpec, mergePaths } from "./util.js";

export function validate(
  specable,
  value,
  { required, context, select: sel = false, key: globalKey } = {}
) {
  const selection = createSelection({
    selection: sel,
    spec: specable,
    required,
  });
  const prunedValue = selection ? select(selection, value) : value;

  function enhanceResult(result) {
    if ([true, null].includes(result.valid)) return result;

    const path = mergePaths(globalKey, result.path);
    return {
      ...result,
      path,
      value: prunedValue,
      valueAtPath: getPath(path, prunedValue),
    };
  }

  if (!specable) return { valid: true };

  if (isFunc(specable))
    return validatePred(specable, prunedValue, context, enhanceResult);

  const specType = typeOf(specable);
  if (typeOf(prunedValue) !== specType)
    return enhanceResult({
      valid: false,
      reason: `must be of type ${specType}`,
    });

  /* If there are keys requirements, check them on the prunedValue. */
  const missingPath = required && findMissingPath(required, prunedValue);
  if (missingPath !== undefined) {
    return enhanceResult({
      valid: false,
      reason: "is required",
      path: missingPath,
    });
  }

  const spec = toSpec(specable);
  const contextMap = new Map(entries(context));

  const globalResult = validate(spec.get(undefined), prunedValue, {
    context,
    key: globalKey,
  });

  const results = entries(prunedValue).reduce(
    (acc, [key, val]) => {
      const subSpec = spec.get(key) || spec.get("...");
      if (!isSpec(subSpec)) return acc;

      const result = validate(subSpec, val, {
        context: contextMap.get(key),
        key,
      });
      return [...acc, result];
    },
    [globalResult]
  );

  return interpretResults(results, enhanceResult);
}

function interpretResults(results = [], enhanceResult) {
  /* Any is invalid */
  const firstInvalid = results.find(
    ({ valid }) => ![null, true].includes(valid)
  );
  if (firstInvalid) return enhanceResult(firstInvalid);

  /* All valid synchronously */
  if (results.every(({ valid }) => valid === true)) return { valid: true };

  /* Some promises */
  const unresolvedResults = results.filter(({ valid }) => valid === null);
  return {
    valid: null,
    promise: resultsRace(unresolvedResults).then((promisedResult) => {
      return interpretResults([promisedResult], enhanceResult);
    }),
  };
}
