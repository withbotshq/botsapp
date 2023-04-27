# BotsApp

An app to make personalized AI bots and chat with them.

**This is not good software and you shouldn't use it unless you _really_ want to.** For now, it's basically Chat GPT with a global shortcut and has no other redeeming qualities. But, we like to work with the garage door open. Anyways, don't use it! Unless you must! Why though? It's just Chat GPT! Now, if you _do_ use it more than once, [let us know](mailto:contact@max.wtf). We'll buy you a coffee to learn more about why you make weird life choices.

<img width="1198" alt="image" src="https://user-images.githubusercontent.com/111631/232243956-76d94fa8-ba2b-468c-ad36-a360c6cfcfbf.png">

## Geting Started

1. Download the app from the [releases page](https://github.com/withbotshq/botsapp/releases) – Apple Silicon only for now.
2. Unzip the archive and drag the app into your Applications folder.
3. Open the app and click on the settings icon in the top right to enter your OpenAI API key.
4. Click on the settings icon to dismiss the panel.
5. Happy chatting!

P.S: You can use the global shortcut (<kbd>⌘</kbd>+<kbd>Ctrl</kbd>+<kbd>B</kbd>) to bring the app to the front.

## Features

- Supports GPT-3.5 and GPT-4 from OpenAI
- BYOK (Bring Your Own Key) for OpenAI
- Streaming responses
- Markdown formatting for responses (syntax highlighting, tables, etc.)
- Global shortcut (<kbd>⌘</kbd>+<kbd>Ctrl</kbd>+<kbd>B</kbd>) to bring the app to the front

## Roadmap

- Support for other models
- Plugins
- Good macOS citizenry (within the realms of Electron)
- Support for other platforms (Windows, and Linux)

## Building Locally

```sh
$ git clone git@github.com:withbotshq/botsapp.git
$ cd botsapp
$ npm install
$ npx nx run botsapp:package
$ open /Applications/Bots.app
```

## Developing Locally

```sh
$ git clone git@github.com:withbotshq/botsapp.git
$ cd botsapp
$ npm install
$ npx nx run botsapp:start
```
