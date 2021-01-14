import merge from "deepmerge";
import { isOpt, opt } from "./opt.js";
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

    const optional = isOpt(subReq);
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
        .map(([key, val]) => [
          key,
          select(explicitSelectionMap.get(key) || spreadSelection, val),
        ])
        .filter(([, val]) => val !== undefined)
    ),
    value
  );
}

export function createSelection({ selection, spec, required }) {
  if (!selection) return undefined;
  if (isColl(selection)) return selection;
  return mergeColls(spec, required);
}

function mergeColls(...arr) {
  const colls = arr.filter(isColl);
  if (colls.length < 2) return colls[0];
  const merged = colls.reduce((a, b) =>
    merge(a, b, { arrayMerge: combineArrays })
  );
  return colls.every(isOpt) ? opt(merged) : merged;
}

function combineArrays(target, source, options) {
  const destination = target.slice();

  source.forEach((item, index) => {
    if (destination[index] === undefined) {
      destination[index] = options.cloneUnlessOtherwiseSpecified(item, options);
    } else if (options.isMergeableObject(item)) {
      destination[index] = merge(target[index], item, options);
    } else if (target.indexOf(item) === -1) {
      destination.push(item);
    }
  });

  destination["..."] = mergeColls(target["..."], source["..."]);
  return destination;
}
