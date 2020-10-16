import { toSpec } from "./collSpec.js";
import { validatePred } from "./pred.js";
import { resultsRace } from "./results.js";
import { typeOf } from "./typeOf.js";
import { entries, getPath, isFunc, isSpec, mergePaths } from "./util.js";

export function validate(
  specable,
  value,
  { required = {}, context, select: sel = false, key: globalKey } = {}
) {
  function enhanceResult(result) {
    if ([true, null].includes(result.valid)) return result;

    const path = mergePaths(globalKey, result.path);
    return { ...result, path, value, valueAtPath: getPath(path, value) };
  }

  if (!specable) return { valid: true };

  if (isFunc(specable))
    return validatePred(specable, value, context, enhanceResult);

  const specType = typeOf(specable);
  if (typeOf(value) !== specType)
    return enhanceResult({
      valid: false,
      reason: `must be of type ${specType}`,
    });

  const spec = toSpec(specable);
  const contextMap = new Map(entries(context));

  const globalResult = validate(spec.get(undefined), value, {
    context,
    key: globalKey,
  });

  const results = entries(value).reduce(
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
