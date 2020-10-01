import * as R from "ramda";
import { validate } from "./validation";

export default function or(...specs) {
  return function _or(value, context) {
    const responses = specs.map((spec) => validate(spec, value, context));
    return interpretResponses(responses);
  };
}

function interpretResponses(responses = []) {
  /* If any response is already valid, `or` is valid. */
  if (responses.some(R.prop("valid"))) return true;

  const promises = R.into(
    [],
    R.compose(R.map(R.prop("promise")), R.reject(R.isNil)),
    responses
  );

  /* If no promises, return the reason of the first invalid reason.
   * If no invalid response is found, `or` is valid. */
  if (R.isEmpty(promises)) {
    const invalidResponse = responses.find(R.propEq("valid", false));
    if (invalidResponse) return invalidResponse.reason;

    return true;
  }

  /* If there is any promise answer, return a global promise
   * that will resolve at the first valid answer
   * or when all promises have resolved. */
  return new Promise((resolve) => {
    promises.forEach((promise) =>
      promise.then((resp) => {
        if (R.prop("valid", resp)) resolve(true);
      })
    );

    Promise.all(promises).then((resolveResults) =>
      resolve(interpretResponses(resolveResults))
    );
  });
}
