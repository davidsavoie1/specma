import { isValid } from "./isValid.js";
import { and } from "./and.js";
import { check } from "./check.js";
import { conform } from "./conform.js";
import { opt, select } from "./selection.js";
import { spread } from "./spread.js";
import { isPromise } from "./util.js";
import { validate } from "./validate.js";

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
// const spec = and(number, not(42));
// const value = 42;

/* Array */
// const spec = spread(and(number, not(42)), []);
// const value = [42, 32, 100];

/* Object */
const spec = and(
  { a: number },
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
  required: { c: 1, obj: opt({ bar: 1 }) },
  select: { a: 1, c: 1 },
};

// log("spec", spec);
// logValidate(spec, value, options);
logOthers(spec, value, options, conform);

function logValidate(spec, value, options) {
  const ping = Date.now();
  const res = validate(spec, value, options);
  log(stringify(res));
  if (res.valid === null) {
    log("...");
    res.promise.then((promised) => {
      const elapsed = Date.now() - ping;
      log(`${elapsed} ms :: \n`, stringify(promised));
    });
  }
}

function logOthers(spec, value, options, method = check) {
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
