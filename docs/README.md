# Specma

_Simple, reusable and composable validation_

Specma is a Javascript library to validate any type of value against a **simple, reusable and composable spec**.

> _Wait... what!? Another validation library? But why?_

- Collection specs defined with the exact **same shape as the value**!
- Based on **predicate functions** of type `true || "reason"`
- **Composable specs** with intuitive `and`/`or` operators
- Easy **cross-validation** between multiple fields
- User defined **customized invalid reasons**
- **Async validation** out of the box
- Very **small footprint**

## Rationale

Coming soon...

## Companion projects

### Svelte-checkable

Client-side validation using [Svelte](https://svelte.dev/) stores that understand Specma specs. Allow reusing the same spec on both front and back-end, enhancing it with additional (potentially async) validation if required. Useful to validate complex (or simple!) form data with very nice, highly customizable error messages for each field. Understands deeply nested structures such as arrays of objects. It has been developped alongside Specma by the same developer.

[View on NPM](https://www.npmjs.com/package/svelte-checkable)

## Inspiration

The main inspiration for this library has been [Clojure Spec](https://clojure.org/about/spec). Although Specma differs from it in its implementation, the rationale and principles are are very similar. Two excellent talks by Clojure's creator Rich Hickey have lead to the creation of this libray:

- [Spec-ulation Keynote](https://www.youtube.com/watch?v=oyLBGkS5ICk): Understanding the difference between attribute and collection validation.
- [Maybe Not](https://www.youtube.com/watch?v=YR5WdGrpoug): Removing keys requirements from the spec itself.
