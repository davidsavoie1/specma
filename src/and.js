import * as R from "ramda";
import { isColl, isPred, isPromise, mergeColls } from "./util";
import { assocPred, getPred } from "./pred";

export default function and(...specs) {
  /* Merge collection specs into a single collection */
  const collSpec = mergeColls(...R.filter(isColl, specs));

  /* Create a merged predicate function that combines all the predicates
   * (attached to collections or not) */
  const preds = specs.map(getPred).filter(isPred);
  function mergedPred(x, context) {
    const answers = preds.map((pred) => pred(x, context));
    return interpretAnswers(answers);
  }

  /* If there's a collection spec, attach the merged pred to it.
   * Otherwise, return it as a simple standalone function predicate. */
  return collSpec ? assocPred(mergedPred, collSpec) : mergedPred;
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
