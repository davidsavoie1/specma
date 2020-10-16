import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import pkg from "./package.json";

const INPUT = "src/index.js";

/* CommonJS (for Node) and ES module (for bundlers) build. */

export default {
  input: INPUT,
  output: [
    { file: pkg.main, format: "cjs" },
    { file: pkg.module, format: "es" },
  ],
  external: ["ramda"], // So it's not included
  plugins: [commonjs(), resolve()],
};
