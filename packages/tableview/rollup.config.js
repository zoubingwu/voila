import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

function config({ format, minify = true, input, ext = 'js' }) {
  const dir = `lib`;

  return {
    input: `./src/${input}.ts`,
    output: {
      name: 'index',
      file: `${dir}/${input}.${format}.${ext}`,
      format,
      sourcemap: true,
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        clean: true,
        typescript: require('typescript'),
        tsconfigOverride: {
          compilerOptions: {
            sourceMap: true,
          },
        },
      }),

      minify
        ? terser({
            compress: true,
            mangle: true,
          })
        : undefined,
    ].filter(Boolean),
  };
}

require('rimraf').sync('lib');

export default [
  { input: 'index', format: 'esm' },
].map(config);
