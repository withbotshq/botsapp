import OpenAPIParser from '@readme/openapi-parser'
import type {OpenAPI} from 'openapi-types'
import {z} from 'zod'

const HttpAuthorizationType = z.union([z.literal('bearer'), z.literal('basic')])
type HttpAuthorizationType = z.infer<typeof HttpAuthorizationType>

const BaseManifestAuth = z.object({
  instructions: z.string().optional()
})
type BaseManifestAuth = z.infer<typeof BaseManifestAuth>

const ManifestNoAuth = BaseManifestAuth.extend({
  type: z.literal('none')
})
type ManifestNoAuth = z.infer<typeof ManifestNoAuth>

const ManifestServiceHttpAuth = BaseManifestAuth.extend({
  type: z.literal('service_http'),
  authorization_type: HttpAuthorizationType,
  verification_tokens: z.record(z.string().optional())
})
type ManifestServiceHttpAuth = z.infer<typeof ManifestServiceHttpAuth>

const ManifestUserHttpAuth = BaseManifestAuth.extend({
  type: z.literal('user_http'),
  authorization_type: HttpAuthorizationType
})
type ManifestUserHttpAuth = z.infer<typeof ManifestUserHttpAuth>

const ManifestOAuthAuth = BaseManifestAuth.extend({
  type: z.literal('oauth'),
  client_url: z.string(),
  scope: z.string(),
  authorization_url: z.string(),
  authorization_content_type: z.string(),
  verification_tokens: z.record(z.string().optional())
})
type ManifestOAuthAuth = z.infer<typeof ManifestOAuthAuth>

const ManifestAuth = z.discriminatedUnion('type', [
  ManifestNoAuth,
  ManifestServiceHttpAuth,
  ManifestUserHttpAuth,
  ManifestOAuthAuth
])
type ManifestAuth = z.infer<typeof ManifestAuth>

const PluginApi = z.object({
  type: z.literal('openapi'),
  url: z.string(),
  is_user_authenticated: z.boolean().optional(),
  has_user_authentication: z.boolean().optional() // FIXME: Some are using this?
})
type PluginApi = z.infer<typeof PluginApi>

const AiPlugin = z.object({
  schema_version: z.string(),
  name_for_human: z.string(),
  name_for_model: z.string(),
  description_for_human: z.string(),
  description_for_model: z.string(),
  auth: ManifestAuth,
  api: PluginApi
})
type AiPlugin = z.infer<typeof AiPlugin>

export type Plugin = {
  aiPlugin: AiPlugin
  openApi: OpenAPI.Document
}

const PluginRequest = z.object({
  tool: z.string(),
  endpoint: z.string(),
  method: z.string(),
  parameters: z.object({}).passthrough()
})
type PluginRequest = z.infer<typeof PluginRequest>

export class PluginController {
  readonly plugins: Promise<Plugin[]>

  constructor(pluginUrls: string[]) {
    this.plugins = this.#loadPlugins(pluginUrls).catch(err => {
      console.error(err)
      return []
    })
  }

  async send(buffer: string[]) {
    const fullMessage = buffer.join('')
    const toolPayloadPrefix = 'Tool Payload: '
    const toolPayload = fullMessage
      .split('\n')
      .find(line => line.startsWith(toolPayloadPrefix))

    if (!toolPayload) {
      throw new Error('Failed to find tool payload')
    }

    const toolPayloadJson = JSON.parse(
      toolPayload.slice(toolPayloadPrefix.length)
    )
    const request = PluginRequest.parse(toolPayloadJson)
    const query =
      request.method !== 'GET'
        ? ''
        : `?${new URLSearchParams(
            Object.entries(request.parameters).map(([k, v]) => [k, String(v)])
          ).toString()}`

    const resp = await fetch(
      `http://127.0.0.1:5001${request.endpoint}${query}`,
      {
        method: request.method,
        body:
          request.method === 'GET' ? null : JSON.stringify(request.parameters)
      }
    )

    if (!resp.ok) {
      throw new Error(
        `Failed to send plugin request: ${resp.status} ${resp.statusText}`
      )
    }

    return resp.json()
  }

  async #loadPlugins(pluginUrls: string[]): Promise<Plugin[]> {
    return Promise.all(
      pluginUrls.map(async pluginUrl => {
        const resp = await fetch(`${pluginUrl}/.well-known/ai-plugin.json`, {
          headers: {Accept: 'application/json'}
        })

        if (!resp.ok) {
          throw new Error(
            `Failed to load plugin manifest from ${pluginUrl}: ${resp.status} ${resp.statusText}`
          )
        }

        const json = await resp.json()
        const aiPlugin = AiPlugin.safeParse(json)

        if (!aiPlugin.success) {
          throw new Error(
            `Failed to parse plugin manifest from ${pluginUrl}: ${aiPlugin.error}`
          )
        }

        const openApiResp = await fetch(aiPlugin.data.api.url)

        if (!openApiResp.ok) {
          throw new Error(
            `Failed to load OpenAPI spec from ${aiPlugin.data.api.url}: ${openApiResp.status} ${openApiResp.statusText}`
          )
        }

        const openApi = await OpenAPIParser.dereference(aiPlugin.data.api.url)

        return {
          aiPlugin: aiPlugin.data,
          openApi
        }
      })
    )
  }
}
