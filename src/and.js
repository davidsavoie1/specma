import { union } from "ramda";
import {
  fromEntries,
  getCollItem,
  getEntries,
  getKeys,
  isArr,
  isColl,
  isPred,
  isPromise,
  isSpec,
  setCollItem,
  typeOf,
} from "./util";
import { assocPred, getPred } from "./pred";
import { isSpread, spread } from "./spread";

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

  /* Extract spread specs, merge collection specs then reassign spread */
  const spreads = specs
    .map((sp) => {
      if (isArr(sp)) return sp.filter(isSpread);
      return getCollItem("...", sp) || [];
    })
    .flat(1);

  const specsWithoutSpread = specs.map((sp) =>
    fromEntries(
      typeOf(sp),
      getEntries(sp).filter(([k, s]) => k !== "..." && !isSpread(s))
    )
  );

  const combinedCollSpec = fromEntries(
    combinedType,
    allKeys.reduce((acc, key) => {
      const specsForThisKey = specsWithoutSpread.reduce((acc, spec) => {
        const subSpec = getCollItem(key, spec);
        return isSpec(subSpec) ? [...acc, subSpec] : acc;
      }, []);
      if (specsForThisKey.length <= 0) return acc;
      return [
        ...acc,
        [
          key,
          specsForThisKey.length > 1
            ? and(...specsForThisKey)
            : specsForThisKey[0],
        ],
      ];
    }, [])
  );

  if (spreads.length <= 0) return combinedCollSpec;

  const combinedSpread = and(...spreads);

  if (isArr(combinedCollSpec))
    return [...combinedCollSpec, spread(combinedSpread)];

  return setCollItem("...", combinedSpread, combinedCollSpec);
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
