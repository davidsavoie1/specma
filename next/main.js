import { and } from "./and.js";
import { validate } from "./validate.js";

const log = console.log.bind(console); // eslint-disable-line no-console

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
// const spec = and([and(number, not(42)), [not("foo")]], minLength(3));
// const value = [41, ["foo"], 100];

/* Object */
const spec = and(
  { a: number },
  { a: not(42), b: not("foo") },
  { obj: { foo: minLength(2) } },
  ({ a, c }) => c > a || "'c' must be higher than 'a'"
);
const value = { a: 4, b: "foo2", c: 300, obj: { foo: "1" } };

logAnswers(spec, value);

function logAnswers(spec, value, context) {
  const ping = Date.now();
  const res = validate(spec, value, context);
  log(res);
  if (res.valid === null) {
    log("...");
    res.promise.then((res) => {
      const elapsed = Date.now() - ping;
      log(`${elapsed} ms ::`, res);
    });
  }
}
