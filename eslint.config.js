// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    type: 'lib',
    ignores: ['geojson', 'playground'],
  },
  {
    rules: {
      'no-console': 'off',
      'ts/explicit-function-return-type': 'off',
      'eslint-comments/no-unlimited-disable': 'off',
      'style/object-curly-spacing': ['error', 'never'],
      'style/block-spacing': 'off',
    },
  },
)
