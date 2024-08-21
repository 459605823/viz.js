// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    type: 'lib',
  },
  {
    files: ['src/**/*.ts'],
    rules: {
      'no-console': 'off',
      'ts/explicit-function-return-type': 'off',
      'eslint-comments/no-unlimited-disable': 'off',
    },
  },
)
