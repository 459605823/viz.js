import path from 'node:path'
import { defineBuildConfig } from 'unbuild'

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
    commonjs: false,
    emitCJS: true,
    inlineDependencies: true,
    alias: {
      entries: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
  },
})
