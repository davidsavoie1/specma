import {
  entries,
  fromMap,
  get,
  getPath,
  keys,
  mergePaths,
  set,
  typeOf,
} from "./util";

export const util = {
  entries,
  fromMap,
  get,
  getPath,
  keys,
  mergePaths,
  set,
  typeOf,
};

export { and } from "./and";
export { check } from "./check";
export { conform } from "./conform";
export { isValid } from "./isValid";
export { key } from "./key";
export { getMessage, setMessages } from "./messages";
export { or } from "./or";
export { getPred } from "./pred";
export { isOpt, opt, select } from "./selection";
export { getSpread, spread } from "./spread";
export { validate } from "./validate";
export { validatePred } from "./validation";
