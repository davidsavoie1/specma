import and from "./and";
import { KEY_SPEC, SPREAD } from "./constants";
import { cloneSpec, isArr, getEntries } from "./util";

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
export function pair(keySpec, valueSpec = () => true) {
  const clone = cloneSpec(valueSpec);
  clone[KEY_SPEC] = and(keySpec, valueSpec[KEY_SPEC]);
  return clone;
}

export function getKeySpec(spec) {
  return spec[KEY_SPEC];
}

export function getSpreadSpec(spec) {
  const entries = getEntries(spec) || [];
  const spreadEntries = entries.filter(
    isArr(spec) ? ([, sp]) => isSpread(sp) : ([key]) => key === "..."
  );

  if (spreadEntries.length <= 0) return undefined;
  if (spreadEntries.length === 1) return spreadEntries[0][1];

  return spreadEntries.map(([, sp]) => sp).reduce(and);
}

export function getDeclaredEntries(spec) {
  const entries = getEntries(spec) || [];
  return entries.filter(
    isArr(spec) ? ([, sp]) => !isSpread(sp) : ([key]) => key !== "..."
  );
}

export function extractSpreadSpec(spec) {
  return [getSpreadSpec(spec), getDeclaredEntries(spec)];
}
