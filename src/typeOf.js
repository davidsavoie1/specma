/* Return a string describing the type of the argument.
 * More precise than the native typeof operator.
 * https://stackoverflow.com/a/28475765
 * typeOf(); //undefined
 * typeOf(null); //null
 * typeOf(NaN); //number
 * typeOf(5); //number
 * typeOf({}); //object
 * typeOf([]); //array
 * typeOf(''); //string
 * typeOf(function () {}); //function
 * typeOf(/a/) //regexp
 * typeOf(new Date()) //date
 * typeOf(new Error) //error
 * typeOf(Promise.resolve()) //promise
 * typeOf(function *() {}) //generatorfunction
 * typeOf(new WeakMap()) //weakmap
 * typeOf(new Map()) //map */
export const typeOf = (obj) =>
  ({}.toString.call(obj).split(" ")[1].slice(0, -1).toLowerCase());
