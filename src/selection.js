import * as R from "ramda";
import { extractSpreadSpec } from "./spread";
import { OPTIONAL } from "./constants";
import {
  fromEntries,
  getCollItem,
  getEntries,
  isColl,
  isPath,
  isTypeOf,
  mergePaths,
  typeOf,
} from "./util";

export function opt(selection = {}) {
  selection[OPTIONAL] = true;
  return selection;
}

function isOpt(selection) {
  return !!selection[OPTIONAL];
}

export function findMissingPath(selection, coll, currKey) {
  const reqEntries = getEntries(selection).filter(([, v]) => !!v);

  /* Get the top level required keys */
  const reqKeys = reqEntries.reduce((acc, [k, v]) => {
    if (isTypeOf("object", v) && isOpt(v)) return acc;
    return [...acc, k];
  }, []);

  const missingKey = reqKeys.find((k) => !R.has(k, coll));
  if (missingKey) return mergePaths(currKey, missingKey);

  /* Drill down recursively into sub paths */
  const missingSubKey = reqEntries.reduce((acc, [k, subReq]) => {
    if (!isTypeOf("object", subReq)) return undefined;

    const optional = !!subReq[OPTIONAL];
    const subValue = getCollItem(k, coll);

    if (!optional && !subValue) return k;
    if (optional && !subValue) return undefined;
    return findMissingPath(subReq, subValue, k);
  }, undefined);

  if (isPath(missingSubKey)) return mergePaths(currKey, missingSubKey);
  return undefined;
}

/* Deep select value from selection. Collection spec can be used as selection.
 * A branch will be selected if its selection value is thruthy. */
export function select(selection, value) {
  if (!(isColl(selection) && isColl(value))) return value;

  const [spread, explicit] = extractSpreadSpec(selection);
  if (!spread && R.isEmpty(explicit)) return value;

  const explicitKeys = R.pluck(0, explicit);

  return fromEntries(
    typeOf(value),
    getEntries(value)
      .filter(
        ([k]) =>
          !!spread || (explicitKeys.includes(k) && getCollItem(k, selection))
      )
      .map(([k, v]) => [k, select(getCollItem(k, selection), v)])
  );
}
