import CopyWebpackPlugin from 'copy-webpack-plugin'
import type {Configuration} from 'webpack'

import {rules} from './rules.ts'

export const mainConfig: Configuration = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/main.ts',
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'node_modules/@dqbd/tiktoken/tiktoken_bg.wasm'
        }
      ]
    })
  ],
  // Put your normal webpack config below here
  module: {
    rules
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json']
  }
}
