import mergeDeepRight from "../node_modules/ramda/es/mergeDeepRight.js";
import { OPTIONAL } from "./constants.js";
import { getSpread } from "./spread.js";
import { entries, fromMap, get, isColl, mergePaths } from "./util.js";

export function opt(selection = {}) {
  selection[OPTIONAL] = true;
  return selection;
}

export function isOpt(selection) {
  return !selection || !!selection[OPTIONAL];
}

export function findMissingPath(selection, coll, currKey) {
  const reqEntries = entries(selection).filter(([, v]) => !!v);

  /* Get the top level required keys */
  const reqKeys = reqEntries.reduce((acc, [k, v]) => {
    if (isColl(v) && isOpt(v)) return acc;
    return [...acc, k];
  }, []);

  const missingKey = reqKeys.find((k) => get(k, coll) === undefined);
  if (missingKey) return mergePaths(currKey, missingKey);

  /* Drill down recursively into sub paths */
  const missingSubKey = reqEntries.reduce((acc, [k, subReq]) => {
    if (!isColl(subReq)) return undefined;

    const optional = !!subReq[OPTIONAL];
    const subValue = get(k, coll);

    if (!optional && !subValue) return k;
    if (optional && !subValue) return undefined;
    return findMissingPath(subReq, subValue, k);
  }, undefined);

  if (missingSubKey !== undefined) return mergePaths(currKey, missingSubKey);
  return undefined;
}

/* Deep select value from selection. Collection spec can be used as selection.
 * A branch will be selected if its selection value is thruthy. */
export function select(selection, value) {
  if (!(isColl(selection) && isColl(value))) return value;

  const explicitSelectionMap = new Map(entries(selection));
  const spreadSelection = getSpread(selection);

  if (!spreadSelection && explicitSelectionMap.size <= 0) return value;

  return fromMap(
    new Map(
      [...entries(value)]
        .filter(([key]) =>
          explicitSelectionMap.has(key)
            ? explicitSelectionMap.get(key)
            : !!spreadSelection
        )
        .map(([key, val]) => [key, select(explicitSelectionMap.get(key), val)])
    ),
    value
  );
}

export function createSelection({ selection, spec, required }) {
  if (!selection) return undefined;
  if (isColl(selection)) return selection;
  return [spec, required].filter(isColl).reduce(mergeDeepRight, {});
}
