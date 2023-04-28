import type {Configuration} from 'webpack'

import {plugins} from './plugins'
import {rules} from './rules.ts'

rules.push({
  test: /\.css$/,
  use: [
    {loader: 'style-loader'},
    {loader: 'css-loader'},
    {loader: 'postcss-loader'}
  ]
})

export const rendererConfig: Configuration = {
  module: {
    rules
  },
  plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css']
  }
}
