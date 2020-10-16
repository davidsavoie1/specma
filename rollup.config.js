import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import pkg from "./package.json";

const INPUT = "src/index.js";

/* Browser-fiendly UMD build */
const umd = {
  input: INPUT,
  output: {
    name: "specma",
    file: pkg.browser,
    format: "umd",
    globals: { ramda: "ramda" },
  },
  plugins: [resolve(), commonjs()],
  external: ["ramda"],
};

/* CommonJS (for Node) and ES module (for bundlers) build.
 * (We could have three entries in the configuration array
 * instead of two, but it's quicker to generate multiple
 * builds from a single configuration where possible, using
 * an array for the `output` option, where we can specify
 * `file` and `format` for each target) */
const cjsEsm = {
  input: INPUT,
  output: [
    { file: pkg.main, format: "cjs" },
    { file: pkg.module, format: "es" },
  ],
  external: ["ramda"], // So it's not included
};

export default [umd, cjsEsm];
