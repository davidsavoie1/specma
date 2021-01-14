import { fromSpec, toSpec } from "./collSpec.js";
import { isOpt, opt } from "./opt.js";
import { combinePreds } from "./pred.js";
import { isColl } from "./util.js";

export function and(...specables) {
  const firstColl = specables.find(isColl);
  if (!firstColl) return combinePreds(...specables);
  const spec = fromSpec(mergeSpecs(...specables), firstColl);
  return specables.every(isOpt) ? opt(spec) : spec;
}

function mergeSpecs(...specables) {
  const specs = specables.map(toSpec);
  const allKeys = new Set(specs.flatMap((spec) => Array.from(spec.keys())));
  return new Map(
    Array.from(allKeys.values()).map((key) => {
      const keySubSpecs = specs
        .filter((spec) => spec.has(key))
        .map((spec) => spec.get(key));
      return [key, and(...keySubSpecs)];
    })
  );
}
