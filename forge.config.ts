import dotenv from 'dotenv'
dotenv.config()

import { utils } from '@electron-forge/core'
import { MakerZIP } from '@electron-forge/maker-zip'
import { ForgeConfig } from '@electron-forge/shared-types'

const config: ForgeConfig = {
  buildIdentifier: process.env.BETA ? 'beta' : 'stable',
  packagerConfig: {
    appBundleId: utils.fromBuildIdentifier({
      beta: 'app.beta.bots',
      stable: 'app.bots'
    }) as unknown as string,
    icon: 'src/desktop/icons/bots.icns',
    osxSign: {},
    extendInfo: 'src/desktop/Info.plist'
  },
  rebuildConfig: {},
  makers: [new MakerZIP({}, ['darwin'])],
  plugins: [
    {
      name: '@electron-forge/plugin-vite',
      config: {
        build: [
          {
            entry: './src/desktop/src/main.ts',
            config: 'vite.main.config.mjs'
          },
          {
            entry: './src/desktop/src/preload.ts',
            config: 'vite.preload.config.mjs'
          }
        ],

        renderer: [
          {
            name: 'main_window',
            config: 'vite.renderer.config.mjs'
          }
        ]
      }
    }
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

  // TODO: Assert?
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  config.packagerConfig!.osxNotarize = {
    appleApiKey: process.env.APPLE_API_KEY,
    appleApiKeyId: process.env.APPLE_API_KEY_ID,
    appleApiIssuer: process.env.APPLE_API_ISSUER
  }
}

notarizeMaybe()

export default config
