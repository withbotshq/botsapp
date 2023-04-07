export interface User {
  id: string
  username: string
  name: string
  avatarUrl: string
  bot?: boolean
}

export const initialUsers: User[] = [
  {
    id: '1',
    username: 'nat',
    name: 'Nat Friedman',
    avatarUrl: 'https://github.com/nat.png'
  },
  {
    id: '2',
    username: 'max',
    name: 'Max Schoening',
    avatarUrl: 'https://github.com/max.png'
  },
  {
    id: '3',
    username: 'jclem',
    name: 'Jonathan Clem',
    avatarUrl: 'https://github.com/jclem.png'
  },
  {
    id: '4',
    username: 'gpt-3.5',
    name: 'GPT-3.5',
    avatarUrl: 'https://github.com/openai.png',
    bot: true
  }
]

export const getUserByID = (id: User['id']) => {
  return initialUsers.filter(u => u.id == id)[0]
}
