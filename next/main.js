import * as s from "./index.js";
import { isPromise } from "./util.js";

const log = console.log.bind(console); // eslint-disable-line no-console
const stringify = (x) => JSON.stringify(x, null, 2);

const minLength = (min) => (x) =>
  x.length >= min || `must have a length of at least ${min}`;
const number = (x) => typeof x === "number" || "must be a number";
const not = (what) => (x) =>
  new Promise((resolve) =>
    setTimeout(() => resolve(x !== what || `must not be ${what}`), 300)
  );

/* Function */
// const spec = s.and(number, not(42));
// const value = 42;

/* Array */
// const spec = spread(s.and(number, not(42)), []);
// const value = [42, 32, 100];

/* Object */
const spec = s.and(
  { a: number, "...": number },
  { a: not(42), b: not("foo") },
  { obj: { foo: minLength(2) } },
  ({ a, c }) => c > a || "'c' must be higher than 'a'"
);
const value = {
  a: 4,
  b: "foo",
  c: 300,
  obj: { foo: "12", bar: "2" },
  d: "oups",
};
const options = {
  required: { c: 1, obj: s.opt({ bar: 1 }) },
  select: { a: 1, c: 1, d: 1 },
};

log("spec", spec);
logValidate(spec, value, options);
// logOthers(spec, value, options, s.conform);

function logValidate(spec, value, options) {
  const ping = Date.now();
  const res = s.validate(spec, value, options);
  log(stringify(res));
  if (res.valid === null) {
    log("...");
    res.promise.then((promised) => {
      const elapsed = Date.now() - ping;
      log(`${elapsed} ms :: \n`, stringify(promised));
    });
  }
}

function logOthers(spec, value, options, method = s.check) {
  const ping = Date.now();
  const res = method(spec, value, options);
  log(res);
  if (isPromise(res)) {
    log("...");
    res.then((res) => {
      const elapsed = Date.now() - ping;
      log(`${elapsed} ms :: \n`, res);
    });
  }
}

// const obj = { a: "a", b: "b", c: { foo: 1, bar: 2, baz: 3 } };
// log(stringify(select({ a: 1, c: { foo: 0, baz: true, "...": true } }, obj)));
