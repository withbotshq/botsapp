# BotsApp

An app to make personalized AI bots and chat with them.

<img width="1198" alt="image" src="https://user-images.githubusercontent.com/111631/232243956-76d94fa8-ba2b-468c-ad36-a360c6cfcfbf.png">

## Geting Started

1. Download the app from the [releases page](https://github.com/withbotshq/botsapp/releases) – Apple Silicon only for now.
2. Unzip the archive and drag the app into your Applications folder.
3. Open the app and click on the settings icon in the top right to enter your OpenAI API key – hit return to save the key 🙈.
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
$ npm run package
$ open /Applications/Bots.app
```

## Developing Locally

```sh
$ git clone git@github.com:withbotshq/botsapp.git
$ cd botsapp
$ npm install
$ npm start
```
