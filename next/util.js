import { typeOf } from "./typeOf.js";

export { typeOf } from "./typeOf.js";

const isType = (type) => (x) => typeOf(x) === type;

export const isArr = isType("array");
export const isColl = (x) => x && typeof x == "object";
export const isFunc = isType("function");
export const isNum = isType("number");
export const isPromise = (x) => x && isFunc(x.then);
export const isSpec = (x) => isFunc(x) || isColl(x);

export const polymorph = (implementations, posOfColl = 1) => (...args) => {
  const type = typeOf(args[posOfColl - 1]);
  const fn = implementations[type] || implementations["_"];
  if (!fn) throw new TypeError(`Not implemented for type '${type}'`);
  return fn(...args);
};

export const entries = polymorph({
  array: (arr) => arr.map((v, i) => [i, v]),
  map: (map) => [...map.entries()],
  object: (obj) => Object.entries(obj),
  _: () => [],
});

export const fromMap = polymorph(
  {
    array: (map) => {
      const indices = [...map.keys()].filter(isNum);
      const maxIndex = Math.max(...indices);
      return Array.from({ length: maxIndex + 1 }, (_, i) => map.get(i));
    },
    map: (map) => new Map(...map.entries()),
    object: (map) =>
      Object.fromEntries(
        [...map.entries()].filter(([key]) => key !== undefined)
      ),
  },
  2
);

export const get = polymorph(
  {
    array: (index, arr) => arr[index],
    map: (key, map) => map.get(key),
    object: (key, obj) => obj[key],
    _: () => undefined,
  },
  2
);

export function getPath(path = [], value) {
  return path.reduce((parent, key) => get(key, parent), value);
}

export const identity = (x) => x;

export function mergePaths(...paths) {
  const path = paths
    .reduce((acc, path) => {
      if (path === undefined) return acc;
      if (isArr(path)) return [...acc, ...path];
      return [...acc, path];
    }, [])
    .filter((key) => key !== undefined);
  return path.length > 0 ? path : undefined;
}
