import { check } from "./check.js";
import { isPromise } from "./util.js";

/* Returns `true`, `false` or a promise that resolves to these values. */
export function isValid(spec, value, options, cb = () => {}) {
  return interpretIsValid(
    check(spec, value, options, (response) => cb(interpretIsValid(response)))
  );
}

export function isValidAsync(...args) {
  return Promise.resolve(isValid(...args));
}

function interpretIsValid(ans) {
  if (ans === true) return true;
  if (isPromise(ans)) return ans.then(interpretIsValid);
  return false;
}
