import { isColl } from "./util.js";
import { validate } from "./validate.js";

/* Return `true` if valid, error reason if invalid
 * or a promise that will return those. */
export function check(...args) {
  return interpretCheck(validate(...args));
}

function interpretCheck({ valid, promise, reason, path = [] }) {
  if (valid === null) return promise.then(interpretCheck);
  if (valid) return true;

  const key = path.join(".");
  if (!key) return reason;

  const stringified = isColl(reason) ? JSON.stringify(reason) : reason;
  const message = `'${key}' ${stringified}`;
  return message;
}
