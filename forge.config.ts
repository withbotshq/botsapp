import {utils} from '@electron-forge/core'
import {MakerZIP} from '@electron-forge/maker-zip'
import {WebpackPlugin} from '@electron-forge/plugin-webpack'
import {ForgeConfig} from '@electron-forge/shared-types'
import {mainConfig} from './webpack.main.config'
import {rendererConfig} from './webpack.renderer.config'

const config: ForgeConfig = {
  buildIdentifier: process.env.BETA ? 'beta' : 'stable',
  packagerConfig: {
    appBundleId: utils.fromBuildIdentifier({
      beta: 'app.beta.bots',
      stable: 'app.bots'
    }) as unknown as string,
    icon: 'icons/bots.icns',
    osxSign: {}
  },
  rebuildConfig: {},
  makers: [new MakerZIP({}, ['darwin'])],
  plugins: [
    new WebpackPlugin({
      mainConfig,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: './src/renderer/index.html',
            js: './src/renderer.tsx',
            name: 'main_window',
            preload: {
              js: './src/preload.ts'
            }
          }
        ]
      }
    })
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'withbotshq',
          name: 'botsapp'
        },
        prerelease: true
      }
    }
  ]
}

function notarizeMaybe() {
  if (process.platform !== 'darwin') return
  if (!process.env.CI) return

  if (
    !process.env.APPLE_API_KEY ||
    !process.env.APPLE_API_KEY_ID ||
    !process.env.APPLE_API_ISSUER
  ) {
    console.warn(
      'Should be notarizing, but environment variables APPLE_API_KEY, APPLE_API_KEY_ID or APPLE_API_ISSUER are missing!'
    )
    return
  }

  config.packagerConfig!.osxNotarize = {
    tool: 'notarytool',
    appleApiKey: process.env.APPLE_API_KEY,
    appleApiKeyId: process.env.APPLE_API_KEY_ID,
    appleApiIssuer: process.env.APPLE_API_ISSUER
  }
}

notarizeMaybe()

export default config
