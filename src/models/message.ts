export interface Message {
  id: string
  author: string
  content: string
  special?: boolean
}

export const initialMessages: Message[] = [
  {id: '1', author: '1', content: 'hi!'},
  {id: '2', author: '4', content: 'Hi! What can I help you with?'},
  {id: '3', author: '1', content: 'what is on my agenda?'},
  {id: '4', author: '4', content: "I can't help you with that, yet."},
  {id: '5', author: '2', content: 'what about on my agenda?'},
  {id: '6', author: '4', content: "I can't help you with that, yet."},
  {
    id: '7',
    author: '1',
    content: 'what are the best restaurants in san francisco?'
  },
  {id: '8', author: '4', content: 'so many'},
  {id: '9', author: '3', content: 'this is not very useful yet'},
  {
    id: '10',
    author: '1',
    content: "yeah, **@max** what's that about? you're useless"
  },
  {
    id: '11',
    author: '1',
    content: 'make me a markdown table, **@gpt-3.5**'
  },
  {
    id: '12',
    author: '4',
    content: `| First Header  | Second Header |
| ------------- | ------------- |
| Content Cell  | Content Cell  |
| Content Cell  | Content Cell  |`,
    special: true
  },
  {
    id: '13',
    author: '1',
    content: 'how do I reverse a string with JavaScript?'
  },
  {
    id: '14',
    author: '4',
    content: `\`\`\`javascript
s.split("").reverse().join("")
\`\`\``,
    special: true
  },
  {
    id: '15',
    author: '1',
    content: 'what about in python?'
  },
  {
    id: '16',
    author: '4',
    content: `\`\`\`python
"Hello World"[::-1]
\`\`\``,
    special: true
  }
  // { id: "1", author: "1", content: "hi!" },
  // { id: "1", author: "1", content: "hi!" },
  // { id: "1", author: "1", content: "hi!" },
  // { id: "1", author: "1", content: "hi!" },
  // { id: "1", author: "1", content: "hi!" },
  // { id: "1", author: "1", content: "hi!" },
  // { id: "1", author: "1", content: "hi!" },
  // { id: "1", author: "1", content: "hi!" },
  // { id: "1", author: "1", content: "hi!" },
  // { id: "1", author: "1", content: "hi!" },
  // { id: "1", author: "1", content: "hi!" },
  // { id: "1", author: "1", content: "hi!" },
  // { id: "1", author: "1", content: "hi!" },
  // { id: "1", author: "1", content: "hi!" },
  // { id: "1", author: "1", content: "hi!" },
  // { id: "1", author: "1", content: "hi!" },
  // { id: "1", author: "1", content: "hi!" },
  // { id: "1", author: "1", content: "hi!" },
  // { id: "1", author: "1", content: "hi!" },
  // { id: "1", author: "1", content: "hi!" },
  // { id: "1", author: "1", content: "hi!" },
]
