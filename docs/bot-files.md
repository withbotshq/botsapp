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

To make this a bot file simply ZIP it and rename the extension to `.bot`:

```bash
zip Buddy.bot bot.json
open Buddy.bot
```
