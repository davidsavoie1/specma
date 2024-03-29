import { and } from "./and.js";
import { defaultMessages, getMessage } from "./messages.js";
import { tagAsResult } from "./results.js";
import { createSelection, findMissingPath, select } from "./selection.js";
import { isColl } from "./util.js";
import { _validate } from "./validation.js";

/* Validate a value against a spec and return a result of shape
 * {
 *   valid: true|false|null
 *   promise,
 *   reason,
 *   value,
 *   failedValue,
 *   failedPath,
 *  }.
 * Built-in messages can be overriden manually.
 * Required fields and value selection can be specified. */
export function validate(
  specable,
  value,
  { messages = defaultMessages, required, selection: sel = false } = {},
  cb = () => {}
) {
  const selection = createSelection({
    selection: sel,
    spec: specable,
    required,
  });
  const prunedValue = selection ? select(selection, value) : value;

  let enhancedSpecable = specable;

  if (isColl(specable) && !!required) {
    enhancedSpecable = and(function requireSpec(value) {
      const missingPath = findMissingPath(required, value);
      if (missingPath === undefined) return true;

      const res = {
        valid: false,
        reason: getMessage("isRequired", messages),
        failedPath: missingPath,
      };
      return tagAsResult(res);
    }, specable);
  }

  const result = _validate(enhancedSpecable, prunedValue, {
    rootValue: prunedValue,
  });

  const enhanced = { ...result, value: prunedValue };

  cb(enhanced);
  if (enhanced.valid === null) enhanced.promise.then(cb);
  return enhanced;
}

export function validateAsync(...args) {
  return validate(...args).promise;
}
