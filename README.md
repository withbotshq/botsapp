# BotsApp

An app to make personalized AI bots and chat with them.

<img width="1198" alt="image" src="https://user-images.githubusercontent.com/111631/232243956-76d94fa8-ba2b-468c-ad36-a360c6cfcfbf.png">

## Building Locally

```bash
$ git clone git@github.com:withbotshq/botsapp.git
$ cd botsapp
$ npm install
$ npm run package
$ open /Applications/Bots.app

# Click on the settings icon in the top right to enter your OpenAI API key
```

## Developing Locally

```bash
$ git clone git@github.com:withbotshq/botsapp.git
$ cd botsapp
$ npm install
$ npm start
```

## MVP

- [x] On launch, the app will ask for your OpenAI API key
- [x] Chat with GPT-3.5 like you can on the OpenAI website
- [ ] Chats can be saved to a local directory
- [x] LLM responses can render Markdown including syntax highlighted code blocks, MathJax, and tables
- [ ] Saved prompt templates can be loaded from a local directory

## First Plugin Steps

- [ ] JavaScript plugins can be loaded from a local directory to change rendering of messages

## Plugins

BotsApp is built with an architecture of participation in mind. Similar to VS Code and Obsidian, the app's behavior can be extended by install plugins. Plugins can be written in TypeScript and are loaded from a local directory.

There are two types of plugin categories:

- Plugins that extend the chat interface with rendering capabilities. For example the Google Maps plugin can render a map when an LLM responds with mapable data.
- Plugins that follow the ReAct pattern and teach LLMs how to access information. For example a web browsing plugin that can fetch websites or a calculator plugin that can evaluate mathematical expressions.

## BYOM

Right now, we are focused on building a good experience for the OpenAI models. But, we believe that the future is multi-model. We want to make it easy for anyone who is working on a model to distribute it with a beautiful and useful user interface.

The first models we are going to try and wrap besides GPT-3.5 are likely entirely local models that can run on a user's computer (i.e llama.cpp).
