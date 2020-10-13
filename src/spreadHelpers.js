import and from "./and";
import { isSpread } from "./spread";
import { isArr, getEntries } from "./util";

export function getSpread(spec) {
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
  return [getSpread(spec), getDeclaredEntries(spec)];
}
