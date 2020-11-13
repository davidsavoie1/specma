import { toSpec } from "./collSpec.js";
import { defaultMessages, getMessage } from "./messages.js";
import { validatePred } from "./pred.js";
import { resultsRace } from "./results.js";
import { createSelection, findMissingPath, select } from "./selection.js";
import { typeOf } from "./typeOf.js";
import { asKey, entries, getPath, isFunc, isSpec, mergePaths } from "./util.js";

export function validate(
  specable,
  value,
  {
    context = {},
    messages = defaultMessages,
    required,
    selection: sel = false,
    key: globalKey,
  } = {},
  cb = () => {}
) {
  const selection = createSelection({
    selection: sel,
    spec: specable,
    required,
  });
  const prunedValue = selection ? select(selection, value) : value;

  function enhanceResult(result) {
    if (result.valid === null) return result;
    if (result.valid === true) return { ...result, value: prunedValue };

    const path = mergePaths(asKey(globalKey), result.path);
    const baseResult = { ...result, path };

    if (result.keyValidation) return baseResult;

    return {
      ...result,
      path,
      value: prunedValue,
      valueAtPath: getPath(path, prunedValue),
    };
  }

  function ensurePromise(res) {
    if (res.promise) return res;
    return { ...res, promise: Promise.resolve(res) };
  }

  function respond(result) {
    const response = ensurePromise(enhanceResult(result));
    cb(response);
    return response;
  }

  if (!specable) return respond({ valid: true });

  if (isFunc(specable))
    return validatePred(specable, prunedValue, {
      context,
      key: globalKey,
      enhanceResult: respond,
    });

  const specType = typeOf(specable);
  if (typeOf(prunedValue) !== specType)
    return respond({
      valid: false,
      reason: `must be of type ${specType}`,
    });

  /* If there are keys requirements, check them on the prunedValue. */
  const missingPath = required && findMissingPath(required, prunedValue);
  if (missingPath !== undefined) {
    return respond({
      valid: false,
      reason: getMessage("isRequired", messages),
      path: missingPath,
    });
  }

  const spec = toSpec(specable);

  const globalResult = validate(spec.get(undefined), prunedValue, {
    context,
    key: globalKey,
  });

  const results = entries(prunedValue).reduce(
    (acc, [key, val]) => {
      const subSpec = spec.get(key) || spec.get("...");
      if (!isSpec(subSpec)) return acc;

      const result = validate(subSpec, val, { context, key });
      return [...acc, result];
    },
    [globalResult]
  );

  return interpretResults(results, respond);
}

function interpretResults(results = [], respond) {
  /* Any is invalid */
  const firstInvalid = results.find(
    ({ valid }) => ![null, true].includes(valid)
  );
  if (firstInvalid) return respond(firstInvalid);

  /* All valid synchronously */
  if (results.every(({ valid }) => valid === true))
    return respond({ valid: true });

  /* Some promises */
  const unresolvedResults = results.filter(({ valid }) => valid === null);
  return {
    valid: null,
    promise: resultsRace(unresolvedResults).then((promisedResult) => {
      return interpretResults([promisedResult], respond);
    }),
  };
}
