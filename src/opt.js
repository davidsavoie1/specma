import { OPTIONAL } from "./constants.js";

export function opt(selection = {}) {
  selection[OPTIONAL] = true;
  return selection;
}

export function isOpt(selection) {
  return !selection || !!selection[OPTIONAL];
}
