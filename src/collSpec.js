import { PRED } from "./constants.js";
import { isColl, isFunc, isNum, polymorph } from "./util.js";

export function toSpec(x) {
  if (isFunc(x)) return new Map([[undefined, x]]);
  if (isColl(x)) {
    return new Map(
      [[undefined, x[PRED]], ...specEntries(x)]
        .filter(([, y]) => y !== undefined)
        .map(([key, y]) => [key, y])
    );
  }
  return x;
}

export const fromSpec = polymorph(
  {
    array: (spec) => {
      const indices = Array.from(spec.keys()).filter(isNum);
      const maxIndex = Math.max(...indices);
      const array = Array.from({ length: maxIndex + 1 }, (_, i) => spec.get(i));
      array["..."] = spec.get("...");
      array[PRED] = spec.get(undefined);
      return array;
    },
    function: (spec) => spec.get(undefined),
    map: (spec) => {
      const map = new Map(
        Array.from(spec.entries()).filter(([key]) => key !== undefined)
      );
      map[PRED] = spec.get(undefined);
      return map;
    },
    object: (spec) => {
      const obj = Object.fromEntries(
        Array.from(spec.entries()).filter(([key]) => key !== undefined)
      );
      obj[PRED] = spec.get(undefined);
      return obj;
    },
  },
  2
);

const specEntries = polymorph({
  array: (arr) => [...arr.map((v, i) => [i, v]), ["...", arr["..."]]],
  map: (map) => Array.from(map.entries()),
  object: (obj) => Object.entries(obj),
});
