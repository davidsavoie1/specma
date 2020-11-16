import { tagAsResult } from "./results";
import { _validate } from "./validation";

export function or(...specs) {
  return function _or(value, goTo) {
    const results = specs.map((spec) => _validate(spec, value, { goTo }));
    return interpretResults(results);
  };
}

function interpretResults(results) {
  /* If any response is already valid, `or` is valid. */
  if (results.some(({ valid }) => valid === true)) return true;

  const pendingResults = results.filter(({ valid }) => valid === null);

  /* If no pending results, return the reason of the first invalid reason.
   * If no invalid result is found, `or` is valid. */
  if (pendingResults.length <= 0) {
    /* If any answer is true, `or` is true. */
    if (results.some(({ valid }) => valid === true)) return true;

    /* Otherwise, return the first failed result */
    const lastInvalid = results.find(({ valid }) => valid === false);

    return tagAsResult(lastInvalid);
  }

  /* If there is any pending result, return a global promise
   * that will resolve at the first valid answer
   * or when all promises have resolved. */
  return raceValidResult(pendingResults);
}

function failIfValidAsync(result) {
  return result.promise.then((promisedRes) => {
    if (promisedRes.valid !== true) return promisedRes;
    throw promisedRes;
  });
}

function raceValidResult(results) {
  return Promise.all(results.map(failIfValidAsync))
    .then(interpretResults)
    .catch(() => true);
}
