export interface Plugin {
  name: string
  avatarUrl?: string
  meta?: {
    path?: string
  }
  enabled: boolean
}

export const initialPlugins: Plugin[] = [
  {name: 'GitHub', avatarUrl: 'https://github.com/github.png', enabled: true},
  {
    name: 'Discord',
    avatarUrl: 'https://github.com/discord.png',
    enabled: true
  },
  {
    name: 'S3 Bucket',
    avatarUrl: 'https://github.com/aws.png',
    enabled: false
  },
  {
    name: 'Local Directory',
    enabled: true,
    meta: {path: '~/Desktop/journal/**/*.md'}
  },
  {
    name: 'Home Assistant',
    avatarUrl: 'https://github.com/home-assistant.png',
    enabled: true,
    meta: {path: 'ws://homeassistant.local:8123/webhooks'}
  },
  {
    name: 'Wolfram Alpha',
    avatarUrl: 'https://github.com/wolfram.png',
    enabled: false
  }
]
