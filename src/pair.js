import and from "./and";
import { KEY_SPEC } from "./constants";
import { cloneSpec } from "./util";

/* Associate a key spec to a spec. If the returned spec is used
 * in a collection, the associated key will be checked against it. */
export default function pair(keySpec, valueSpec = () => true) {
  const clone = cloneSpec(valueSpec);
  clone[KEY_SPEC] = and(keySpec, valueSpec[KEY_SPEC]);
  return clone;
}

export function getKeySpec(spec) {
  return spec[KEY_SPEC];
}
