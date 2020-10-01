import * as R from "ramda";
import and from "./and";
import { cloneSpec, isArr, getEntries } from "./util";

export const SPREAD = Symbol("SPREAD");
export const KEY_SPEC = Symbol("KEY_SPEC");

export function spread(spec) {
  const clone = cloneSpec(spec);
  clone[KEY_SPEC] = getKeySpec(spec);
  clone[SPREAD] = true;
  return clone;
}

export function isSpread(spec) {
  return spec[SPREAD] === true;
}

/* Associate a key spec to a spec. If the returned spec is used
 * in a collection, the associated key will be checked against it. */
export function pair(keySpec, valueSpec = R.T) {
  const clone = cloneSpec(valueSpec);
  clone[KEY_SPEC] = and(keySpec, valueSpec[KEY_SPEC]);
  return clone;
}

export function getKeySpec(spec) {
  return spec[KEY_SPEC];
}

export function extractSpredSpec(spec) {
  const [spreadEntries, declaredEntries] = R.partition(
    isArr(spec) ? ([, sp]) => isSpread(sp) : ([key]) => key === "...",
    getEntries(spec)
  );

  const combinedSpread = R.cond([
    [R.isEmpty, R.always(undefined)],
    [(arr) => arr.length === 1, R.path([0, 1])],
    [
      R.T,
      R.transduce(
        R.map(([, sp]) => sp),
        and,
        undefined
      ),
    ],
  ])(spreadEntries);
  return [combinedSpread, declaredEntries];
}
