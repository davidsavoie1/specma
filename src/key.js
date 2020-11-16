import { validatePred } from "./validation";
import { tagAsResult } from "./results";

/* Create a predicate that will check a value's key
 * instead of the value itself. */
export function key(keySpec) {
  return (value, getFrom, options = {}) => {
    const result = validatePred(keySpec, options.key, getFrom, options);
    if (result.valid === false) result.failedValue = options.key;
    return tagAsResult({ ...result, keyValidation: true });
  };
}
