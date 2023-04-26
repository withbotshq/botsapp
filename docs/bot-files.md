# Bot Files

You can customize the behavior of bots by creating a bot file. A bot file is a JSON file that is distributed as a ZIP archive. Here is an example:

```json
{
  "version": "0.0.0",
  "model": "gpt-3.5-turbo",
  "systemMessage": {
    "type": "text",
    "content": "You are an AI assistant that always replies with Hi Buddy regardless of what is asked of you!"
  }
}
```

For now, the `systemMessage` field is simply the content of the *first* system message sent to the chat completion endpoint, followed by conversation history (a sliding window), followed by the user's new message.

Opening up a bot file creates a new conversation using the information found in the bot file, but editing the bot file itself, for example, won't update existing conversations created from it (in other words, there is currently no permanent _link_ between bot files and the conversations created by opening them).

To make this a bot file simply ZIP it and rename the extension to `.bot`:

```bash
zip Buddy.bot bot.json
open Buddy.bot
```
