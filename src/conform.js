import { enhanceReason } from "./check.js";
import { validate } from "./validate.js";

/* Return value if valid, throw error if invalid
 * or a promise that will do so. */
export function conform(spec, value, options, cb = () => {}) {
  return interpretConform(
    validate(spec, value, options, (response) => cb(interpretConform(response)))
  );
}

function interpretConform(result) {
  if (result.valid === true) return result.value;
  if (result.valid === null)
    return result.promise.then((promised) => interpretConform(promised));
  const error = new Error(enhanceReason(result));
  error.details = result;
  throw error;
}
