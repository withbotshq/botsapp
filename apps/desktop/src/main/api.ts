import {
  CreateChatRequest,
  CreateChatResponse,
  CreateMessageRequest,
  OKResponse,
  UpdateChatRequest
} from '@withbotshq/shared/api'
import {Chat, Message} from '@withbotshq/shared/schema'

const apiURL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://botsapp-www.vercel.dev'

export async function enableChatSharing(
  chat: Chat,
  messages: Message[]
): Promise<CreateChatResponse> {
  const resp = await fetchJSON('/api/chats', {
    body: {chat, messages} satisfies CreateChatRequest
  })

  if (!resp.ok) {
    console.error(
      'Failed to share chat',
      resp.status,
      resp.statusText,
      await resp.text()
    )
    throw new Error('Failed to share chat')
  }

  return CreateChatResponse.parse(await resp.json())
}

export async function disableChatSharing(chat: Chat): Promise<OKResponse> {
  const resp = await fetchJSON(`/api/chats/${chat.id}`, {
    method: 'DELETE'
  })

  if (!resp.ok) {
    console.error(
      'Failed to unshare chat',
      resp.status,
      resp.statusText,
      await resp.text()
    )

    throw new Error('Failed to unshare chat')
  }

  return OKResponse.parse(await resp.json())
}

export async function updateChat(chat: Chat): Promise<OKResponse> {
  const resp = await fetchJSON(`/api/chats/${chat.id}`, {
    method: 'PATCH',
    body: {chat} satisfies UpdateChatRequest
  })

  if (!resp.ok) {
    console.error(
      'Failed to update chat',
      resp.status,
      resp.statusText,
      await resp.text()
    )
    throw new Error('Failed to update chat')
  }

  return OKResponse.parse(await resp.json())
}

export async function createMessage(
  chat: Chat,
  message: Message
): Promise<OKResponse> {
  const resp = await fetchJSON(`/api/chats/${chat.id}/messages`, {
    body: message satisfies CreateMessageRequest
  })

  if (!resp.ok) {
    console.error(
      'Failed to create message',
      resp.status,
      resp.statusText,
      await resp.text()
    )
    throw new Error('Failed to create message')
  }

  return OKResponse.parse(await resp.json())
}

export async function deleteMessage(
  chat: Chat,
  message: Message
): Promise<OKResponse> {
  const resp = await fetchJSON(`/api/chats/${chat.id}/messages/${message.id}`, {
    method: 'DELETE'
  })

  if (!resp.ok) {
    console.error(
      'Failed to delete message',
      resp.status,
      resp.statusText,
      await resp.text()
    )
    throw new Error('Failed to delete message')
  }

  return OKResponse.parse(await resp.json())
}

function fetchJSON(
  path: string,
  init: Omit<RequestInit, 'body'> & {body?: unknown}
) {
  return fetch(new URL(path, apiURL).toString(), {
    ...init,
    method: init.method ?? (init.body != null ? 'POST' : 'GET'),
    headers: {
      ...init.headers,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: init.body ? JSON.stringify(init.body) : undefined
  })
}
