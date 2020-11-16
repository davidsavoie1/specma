import { fromSpec, toSpec } from "./collSpec.js";
import { combinePreds } from "./pred.js";
import { isColl, isSpec } from "./util.js";

export function and(...specables) {
  const filtered = specables.filter(isSpec);
  const firstColl = filtered.find(isColl);
  if (!firstColl) return combinePreds(...filtered);
  return fromSpec(mergeSpecs(...filtered), firstColl);
}

function mergeSpecs(...specables) {
  const specs = specables.map(toSpec);
  const allKeys = new Set(specs.map((spec) => Array.from(spec.keys())).flat());
  return new Map(
    Array.from(allKeys.values()).map((key) => {
      const keySubSpecs = specs
        .filter((spec) => spec.has(key))
        .map((spec) => spec.get(key));
      return [key, and(...keySubSpecs)];
    })
  );
}
