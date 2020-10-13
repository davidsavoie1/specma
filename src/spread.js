import { KEY_SPEC, SPREAD } from "./constants";
import { cloneSpec } from "./util";

export function spread(spec) {
  const clone = cloneSpec(spec);
  clone[KEY_SPEC] = spec[KEY_SPEC];
  clone[SPREAD] = true;
  return clone;
}

export function isSpread(spec) {
  return spec && spec[SPREAD] === true;
}
