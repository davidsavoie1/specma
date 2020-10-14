import {
  always,
  chain,
  compose,
  curry,
  filter,
  fromPairs,
  into,
  isEmpty,
  map,
  of,
  path,
  pipe,
  unless,
  when,
} from "ramda";

/* Return a string describing the type of the argument.
 * More precise than the native typeof operator.
 * https://stackoverflow.com/a/28475765
 * typeOf(); //undefined
 * typeOf(null); //null
 * typeOf(NaN); //number
 * typeOf(5); //number
 * typeOf({}); //object
 * typeOf([]); //array
 * typeOf(''); //string
 * typeOf(function () {}); //function
 * typeOf(/a/) //regexp
 * typeOf(new Date()) //date
 * typeOf(new Error) //error
 * typeOf(Promise.resolve()) //promise
 * typeOf(function *() {}) //generatorfunction
 * typeOf(new WeakMap()) //weakmap
 * typeOf(new Map()) //map */
export const typeOf = (obj) =>
  ({}.toString.call(obj).split(" ")[1].slice(0, -1).toLowerCase());

export const isTypeOf = curry((type, x) => typeOf(x) === type);

export const isArr = isTypeOf("array");
export const isFunc = (x) =>
  isTypeOf("function", x) || isTypeOf("asyncfunction", x);
export const isObj = (x) => typeOf(x) === "object" && !isArr(x);
export const isNil = (x) => [undefined, null].includes(x);
export const isNum = (x) => typeOf(x) === "number";
// export const isObj = (x) => typeOf(x) === "object" && x !== null;
export const isPromise = (x) => x && isFunc(x.then);
export const isStr = (x) => typeOf(x) === "string";
export const isSym = (x) => typeOf(x) === "symbol";

export const isKey = (x) => isStr(x) || isNum(x);
export const isPred = isFunc;
// export const isReason = (x) => anyPass([isStr, isNum, isSym], x);
export const isColl = (x) => ["array", "object", "map"].includes(typeOf(x));
export const isSpec = (x) => anyPass([isPred, isColl], x);

export function getKeys(coll) {
  const func = {
    array: (arr) => arr.map((v, i) => i),
    object: Object.keys,
    map: (map) => map.keys,
  }[typeOf(coll)];

  return func ? func(coll) : [];
}

export const isPath = (x) => isArr(x) && x.every(isKey);
export const mergePaths = (...paths) =>
  pipe(
    into([], compose(chain(unless(isArr, of)), filter(isKey))),
    when(isEmpty, always(undefined))
  )(paths);

export function getSubSpec(pathOrKey, spec) {
  return path(
    unless(isArr, (key) => [key], pathOrKey),
    spec
  );
}

export function getEntries(coll) {
  const func = {
    array: (arr) => arr.map((v, i) => [i, v]),
    object: Object.entries,
    map: (map) => Array.from(map.entries()),
  }[typeOf(coll)];

  if (!func) return [];
  return func(coll);
}

export function fromEntries(type, entries = []) {
  const combiner = {
    array: map(([, v]) => v),
    object: fromPairs,
    map: Map.fromEntries,
  }[type];

  if (!combiner) return undefined;
  return combiner(entries);
}

export function getCollItem(key, coll) {
  const getter = {
    array: (arr) => arr[key],
    object: (obj) => obj[key],
    map: (map) => map.get(key),
  }[typeOf(coll)];

  return getter && getter(coll);
}

export function setCollItem(key, value, coll) {
  const setter = {
    array: (arr) => {
      const before = arr.slice(0, key);
      const after = key < arr.length ? arr.slice(key + 1) : [];
      return [...before, value, ...after];
    },
    object: (obj) => ({ ...obj, [key]: value }),
    map: (map) => {
      const newMap = new Map(map.entries());
      newMap.set(key, value);
      return newMap;
    },
  }[typeOf(coll)];

  return setter ? setter(coll) : coll;
}

export function mergeColls(...specs) {
  return fromEntries(typeOf(specs[0]), chain(getEntries, specs));
}

function anyPass(preds, x) {
  return preds.some((pred) => pred(x));
}

export function cloneSpec(spec) {
  const cloner = {
    map: (map) => new Map(getEntries(map)),
    object: (obj) => ({ ...obj }),
    array: (arr) => [...arr],
    function: (pred) => {
      /* Wrap the pred function in new function,
       * but try to keep the same name */
      const clonedPred = (...args) => pred(...args);
      nameFunc(clonedPred, pred.name);
      return clonedPred;
    },
  }[typeOf(spec)];

  if (!cloner) return spec;
  return cloner(spec);
}

export function pickColl(keys, coll) {
  return pipe(
    getEntries,
    filter(([k]) => keys.includes(k)),
    (entries) => fromEntries(typeOf(coll), entries)
  )(coll);
}

/* Associate a name to a function */
export function nameFunc(fn, name) {
  Object.defineProperty(fn, "name", {
    value: name || fn.name,
    configurable: true,
  });
}
