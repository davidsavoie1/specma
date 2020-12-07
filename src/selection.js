import merge from "deepmerge";
import { OPTIONAL } from "./constants.js";
import { getSpread } from "./spread.js";
import {
  asKey,
  entries,
  fromMap,
  get,
  isColl,
  keys,
  mergePaths,
} from "./util.js";

export function opt(selection = {}) {
  selection[OPTIONAL] = true;
  return selection;
}

export function isOpt(selection) {
  return !selection || !!selection[OPTIONAL];
}

export function findMissingPath(selection, coll, currKey) {
  let reqEntries = entries(selection).filter(([k, v]) => k !== "..." && !!v);

  /* Append all collection keys as requirement entries if a spread is defined. */
  const spreadSelection = getSpread(selection);
  if (spreadSelection && !(isOpt(spreadSelection) && coll === undefined)) {
    reqEntries = [
      ...reqEntries,
      ...keys(coll).map((k) => [k, spreadSelection]),
    ];
  }

  /* Get the top level required keys */
  const reqKeys = reqEntries.reduce((acc, [k, v]) => {
    if (isColl(v) && isOpt(v)) return acc;
    return [...acc, k];
  }, []);

  const missingKey = reqKeys.find((k) => get(k, coll) === undefined);
  if (missingKey !== undefined) return mergePaths(asKey(currKey), missingKey);

  /* Drill down recursively into sub paths */
  const missingSubKey = reqEntries.reduce((acc, [k, subReq]) => {
    if (acc !== undefined) return acc;

    if (!isColl(subReq)) return undefined;

    const optional = !!subReq[OPTIONAL];
    const subValue = get(k, coll);

    if (!optional && !subValue) return k;
    if (optional && !subValue) return undefined;
    return findMissingPath(subReq, subValue, k);
  }, undefined);

  if (missingSubKey !== undefined)
    return mergePaths(asKey(currKey), missingSubKey);
  return undefined;
}

/* Deep select value from selection. Collection spec can be used as selection.
 * A branch will be selected if its selection value is thruthy. */
export function select(selection, value) {
  if (!(isColl(selection) && isColl(value))) return value;

  const explicitSelectionMap = new Map(
    entries(selection).filter(([k]) => k !== "...")
  );
  const spreadSelection = getSpread(selection);

  if (!spreadSelection && explicitSelectionMap.size <= 0) return value;

  return fromMap(
    new Map(
      Array.from(entries(value))
        .filter(([key]) =>
          explicitSelectionMap.has(key)
            ? explicitSelectionMap.get(key)
            : !!spreadSelection
        )
        .map(([key, val]) => [key, select(explicitSelectionMap.get(key), val)])
        .filter(([, val]) => val !== undefined)
    ),
    value
  );
}

export function createSelection({ selection, spec, required }) {
  if (!selection) return undefined;
  if (isColl(selection)) return selection;
  return [spec, required].filter(isColl).reduce((a, b) => merge(a, b), {});
}
