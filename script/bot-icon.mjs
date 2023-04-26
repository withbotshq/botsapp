#!/usr/bin/env node

/* eslint-env node */

import {assert} from '@jclem/assert'
import {execSync} from 'child_process'
import decompress from 'decompress'
import {parseArgs} from 'util'

const {
  values: {'open-ai-key': openAIKeyFlag},
  positionals: [botFilePath]
} = parseArgs({
  strict: true,
  allowPositionals: true,
  options: {
    'open-ai-key': {
      type: 'string',
      short: 'k'
    }
  }
})

assert(botFilePath, 'One argument pointing to the bot file is required')

const openAIKey = openAIKeyFlag || process.env.OPENAI_API_KEY
const botFile = JSON.parse(
  assert(
    (await decompress(assert(botFilePath)))
      .find(file => file.path === 'bot.json' && file.type === 'file')
      ?.data.toString('utf8')
  )
)

const systemPrompt = botFile.systemMessage.content

const prompt = `
A beautiful, highly polished icon by an expert macOS icon designer. The icon has
no text, and the image represents only the icon itself and no other software
chrome. The icon is humorous and playful, but also professional and polished.
The icon suits an AI bot app with this bot instruction:

${systemPrompt}
`.trim()

console.log(`Generating an icon from this prompt:\n\n${prompt}`)

const resp = await fetch('https://api.openai.com/v1/images/generations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${openAIKey}`
  },
  body: JSON.stringify({
    prompt,
    size: '1024x1024'
  })
})

if (!resp.ok) {
  throw new Error(await resp.text())
}

const {
  data: [{url}]
} = await resp.json()

execSync(`open "${url}"`)
