import path from 'node:path'
import {defineBuildConfig} from 'unbuild'

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
    inlineDependencies: true,
    alias: {
      entries: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
  },
})
