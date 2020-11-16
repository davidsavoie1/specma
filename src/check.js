import { validate } from "./validate.js";

/* Return `true` if valid, error reason if invalid
 * or a promise that will return those. */
export function check(spec, value, options, cb = () => {}) {
  return interpretCheck(
    validate(spec, value, options, (result) => cb(interpretCheck(result)))
  );
}

function interpretCheck(result) {
  if (result.valid === null) return result.promise.then(interpretCheck);
  if (result.valid === true) return true;

  return enhanceReason(result);
}

export function enhanceReason({ reason, failedPath = [] }) {
  const key = failedPath.join(".");
  const stringified =
    typeof reason === "object" ? JSON.stringify(reason) : reason.toString();
  const message = key ? `'${key}' ${stringified}` : stringified;
  return message;
}
