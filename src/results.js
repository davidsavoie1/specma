function passFailAsync(result) {
  return result.promise.then((promisedRes) => {
    if (promisedRes.valid === true) return promisedRes;
    throw promisedRes;
  });
}

export function resultsRace(results) {
  return Promise.all(results.map(passFailAsync))
    .then(() => ({ valid: true }))
    .catch((result) => result);
}
