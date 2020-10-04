import { KEY_SPEC, PRED, SPREAD } from "./constants";
import { cloneSpec, isPred } from "./util";

/* Clone a collection spec and associate a pred to `PRED` symbol key */
export function assocPred(pred, collSpec) {
  const clone = cloneSpec(collSpec);
  clone[PRED] = pred;
  clone[SPREAD] = collSpec[SPREAD];
  clone[KEY_SPEC] = collSpec[KEY_SPEC];
  return clone;
}

export function getPred(spec) {
  if (isPred(spec)) return spec;
  return spec && spec[PRED];
}
