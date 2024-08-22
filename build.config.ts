import path from 'node:path'
import {defineBuildConfig} from 'unbuild'
import image from '@rollup/plugin-image'

export default defineBuildConfig({
  entries: [
    'src/index',
  ],
  declaration: true,
  clean: true,
  alias: {
    '@': path.resolve(__dirname, 'src'),
  },
  rollup: {
    emitCJS: true,
    commonjs: {
      exclude: 'node_modules',
      extensions: ['.mjs', '.cjs', '.js', '.jsx'],
    },
    esbuild: {
      minify: true,
    },
    inlineDependencies: true,
  },
  hooks: {
    'rollup:options': (_, options) => {
      if (Array.isArray(options.plugins)) {
        options.plugins.push(image())
      }
    },
  },
})
