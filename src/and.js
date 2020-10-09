import { union } from "ramda";
import {
  fromEntries,
  getCollItem,
  getKeys,
  isColl,
  isPred,
  isPromise,
  typeOf,
} from "./util";
import { assocPred, getPred } from "./pred";

export default function and(...specs) {
  /* Create a merged predicate function that combines all the predicates
   * (predicate function or attached to collections) */
  const preds = specs.map(getPred).filter(isPred);
  const mergedPred = combinePreds(...preds);

  const collSpecs = specs.filter(isColl, specs);
  if (collSpecs.length <= 0) return mergedPred;

  /* Merge collection specs into a single collection. */
  const collSpec = combineCollSpecs(...collSpecs);

  /* If there's a collection spec, attach the merged pred to it. */
  return assocPred(mergedPred, collSpec);
}

function combinePreds(...preds) {
  return function mergedPred(x, context) {
    return interpretAnswers(preds.map((pred) => pred(x, context)));
  };
}

function combineCollSpecs(...specs) {
  /* If each spec has a different collection type (ie array and object),
   * use a Map to ensure proper key integrity. */
  const combinedType = specs
    .map(typeOf)
    .reduce((t1, t2) => (t1 === t2 ? t1 : "map"));

  const allKeys = specs.map(getKeys).reduce(union);

  return fromEntries(
    combinedType,
    allKeys.map((key) => [
      key,
      and(...specs.map((spec) => getCollItem(key, spec))),
    ])
  );
}

function interpretAnswers(answers = []) {
  /* If every answer is already valid (true), return true */
  if (answers.every((ans) => ans === true)) return true;

  /* If there's already a failed pred, return it. */
  const failure = answers.find((ans) => ans !== true && !isPromise(ans));
  if (failure) return failure;

  /* If there is any promise answer, return a global promise
   * that will resolve at the first invalid answer
   * or when all promises have resolved. */
  return new Promise((resolve) => {
    const promises = answers.filter(isPromise);

    promises.forEach((promise) =>
      promise.then((ans) => {
        if (ans !== true) resolve(ans);
      })
    );

    Promise.all(promises).then((resolvedAnswers) =>
      resolve(interpretAnswers(resolvedAnswers))
    );
  });
}
