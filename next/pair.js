import { and } from "./and";
import { RESULT } from "./constants";
import { validate } from "./validate";

/* Associate a key spec to a spec. If the returned spec is used
 * in a collection, the associated key will be checked against it. */
export function pair([keySpec, valueSpec]) {
  const keyPred = (value, context, key) => {
    const result = {
      ...validate(keySpec, key, { context }),
      keyValidation: true,
    };
    result[RESULT] = true;
    return result;
  };

  return and(keyPred, valueSpec);
}
