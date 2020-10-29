import { fromSpec, toSpec } from "./collSpec.js";
import { combinePreds } from "./pred.js";
import { isColl } from "./util.js";

export function mergeSpecs(...specables) {
  const specs = specables.map(toSpec);
  const allKeys = new Set(specs.map((spec) => Array.from(spec.keys())).flat());
  return new Map(
    Array.from(allKeys.values()).map((key) => {
      const keySubSpecs = specs
        .filter((spec) => spec.has(key))
        .map((spec) => spec.get(key));
      return [key, combinePreds(...keySubSpecs)];
    })
  );
}

export function and(...specables) {
  const firstColl = specables.find(isColl);
  if (!firstColl) return combinePreds(...specables);
  return fromSpec(mergeSpecs(...specables), firstColl);
}
