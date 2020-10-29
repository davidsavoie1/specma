import { and } from "./and.js";
import { get, isColl } from "./util.js";

export function spread(spec, coll = []) {
  if (!isColl(coll))
    throw new TypeError(
      "Spread (...) can only be applied on a collection spec"
    );

  return and(coll, new Map([["...", spec]]));
}

export function getSpread(coll) {
  return get("...", coll);
}
