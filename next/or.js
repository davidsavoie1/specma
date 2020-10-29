import { RESULT } from "./constants";
import { validate } from "./validate";

export function or(...specs) {
  return function _or(value, context = {}) {
    const responses = specs.map((spec) => validate(spec, value, { context }));
    return interpretResponses(responses);
  };
}

function interpretResponses(responses) {
  /* If any response is already valid, `or` is valid. */
  if (responses.some(({ valid }) => valid === true)) return true;

  const pendingResults = responses.filter(({ valid }) => valid === null);

  /* If no pending results, return the reason of the first invalid reason.
   * If no invalid result is found, `or` is valid. */
  if (pendingResults.length <= 0) {
    const firstInvalid = responses.find(({ valid }) => valid === false);
    if (firstInvalid) {
      /* Tagging it as a result will allow keeping the result intact in validation */
      firstInvalid[RESULT] = true;
      return firstInvalid;
    }

    return true;
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
    .then(interpretResponses)
    .catch(() => true);
}
