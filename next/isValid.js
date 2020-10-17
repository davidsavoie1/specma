import { check } from "./check.js";
import { isPromise } from "./util.js";

/* Returns `true`, `false` or a promise that resolves to these values. */
export function isValid(...args) {
  return interpretIsValid(check(...args));
}

function interpretIsValid(ans) {
  if (ans === true) return true;
  if (isPromise(ans)) return ans.then(interpretIsValid);
  return false;
}
