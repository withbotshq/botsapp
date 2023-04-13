/* eslint-env node */

/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config()
const {
  utils: {fromBuildIdentifier}
} = require('@electron-forge/core')

const config = {
  buildIdentifier: process.env.BETA ? 'beta' : 'stable',
  packagerConfig: {
    appBundleId: fromBuildIdentifier({
      beta: 'app.beta.bots',
      stable: 'app.bots'
    }),
    icon: 'icons/bots.icns',
    osxSign: {}
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin']
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-vite',
      config: {
        // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
        // If you are familiar with Vite configuration, it will look really familiar.
        build: [
          {
            // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
            entry: 'src/main.ts',
            config: 'vite.main.config.ts'
          },
          {
            entry: 'src/preload.ts',
            config: 'vite.preload.config.ts'
          }
        ],
        renderer: [
          {
            name: 'main_window',
            config: 'vite.renderer.config.ts'
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

  config.packagerConfig.osxNotarize = {
    tool: 'notarytool',
    appleApiKey: process.env.APPLE_API_KEY,
    appleApiKeyId: process.env.APPLE_API_KEY_ID,
    appleApiIssuer: process.env.APPLE_API_ISSUER
  }
}

notarizeMaybe()

module.exports = config
