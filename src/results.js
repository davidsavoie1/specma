import { RESULT, VALID } from "./constants";
import { isColl } from "./util";

/* Check if result has been tagged as one. */
export function isResult(res) {
  return isColl(res) && !!res[RESULT];
}

/* Throw promised result if it is invalid. */
function passFailAsync(result) {
  return result.promise.then((promisedRes) => {
    if (promisedRes.valid === true) return promisedRes;
    throw promisedRes;
  });
}

/* Race for first invalid result by capturing it in a `catch` clause.
 * If all promises resolve without triggering the catch,
 * it means that all are valid. */
export function resultsRace(results) {
  return Promise.all(results.map(passFailAsync))
    .then(() => VALID)
    .catch((result) => result);
}

/* Tag a result as one, so that a predicate function
 * could return one without it being considered a failed
 * predicate answer. */
export function tagAsResult(result) {
  result[RESULT] = true;
  return result;
}
