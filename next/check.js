import { isColl } from "./util.js";
import { validate } from "./validate.js";

/* Return `true` if valid, error reason if invalid
 * or a promise that will return those. */
export function check(...args) {
  return interpretCheck(validate(...args));
}

function interpretCheck(result) {
  if (result.valid === null) return result.promise.then(interpretCheck);
  if (result.valid === true) return true;

  return enhanceReason(result);
}

export function enhanceReason({ reason, path = [] }) {
  const key = path.join(".");
  if (!key) return reason;

  const stringified = isColl(reason) ? JSON.stringify(reason) : reason;
  const message = `'${key}' ${stringified}`;
  return message;
}
