import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      exports: 'auto',
    },
    {
      file: 'dist/index.mjs',
      format: 'esm',
    },
  ],
  external: ['fs', 'path', 'child_process'],
  plugins: [terser()],
};
