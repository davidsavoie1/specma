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
export { check, checkAsync } from "./check";
export { conform, conformAsync } from "./conform";
export { isValid, isValidAsync } from "./isValid";
export { key } from "./key";
export { getMessage, setMessages } from "./messages";
export { isOpt, opt } from "./opt";
export { or } from "./or";
export { getPred } from "./pred";
export { createSelection, select } from "./selection";
export { getSpread, spread } from "./spread";
export { validate, validateAsync } from "./validate";
export { validatePred } from "./validation";
