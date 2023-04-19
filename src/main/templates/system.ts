import {OpenAPIV2, OpenAPIV3, OpenAPIV3_1} from 'openapi-types'
import yaml from 'yaml'
import {Plugin} from '../chat/plugin-controller'

export function renderSystemTemplate(plugins: Plugin[]) {
  return `
You are Chat, an AI assistant based on OpenAI's GPT models. Follow the user's
instructions carefully, but be concise. Do not offer great detail unless the
user asks for it. Respond using Markdown.

${plugins.length > 0 ? renderPlugins(plugins) : ''}`
}

function renderPlugins(plugins: Plugin[]) {
  return `
You have at your disposal a number of tools that you can call in order to gather
more information for helping the user:

${yaml.stringify(plugins.map(renderPlugin))}

When you need to use a tool, you can do so by responding with the following
format (without the Markdown code block):

Thought: Do I need to use a tool? Yes.
Reasoning: (Explain your reasoning for using the tool).
Tool Payload: {"tool": "$tool-name", "endpoint": "$tool-endpoint-path", "method": "$tool-endpoint-method", "parameters": {}}
Observeration: $the-output-of-the-tool`.trim()
}

function renderPlugin(plugin: Plugin) {
  const paths: [
    string,
    (
      | OpenAPIV2.PathItemObject
      | OpenAPIV3.PathItemObject
      | OpenAPIV3_1.PathItemObject
    )
  ][] = Object.entries(plugin.openApi.paths ?? {})

  return {
    name: plugin.aiPlugin.name_for_model,
    description: plugin.aiPlugin.description_for_model,
    endpoints: paths.map(([path, pathItem]) => {
      const operations: [
        string,
        (
          | OpenAPIV2.OperationObject
          | OpenAPIV3.OperationObject
          | OpenAPIV3_1.OperationObject
        )
      ][] = Object.entries(pathItem)

      return operations
        .map(([method, operation]) => {
          return {
            method: method.toUpperCase(),
            path: path,
            description: operation.description,
            parameters:
              operation.parameters?.map(param => {
                param = param as OpenAPIV3_1.ParameterObject // TODO: Handle other versions.

                return {
                  name: param.name,
                  description: param.description,
                  required: param.required
                }
              }) ?? []
          }
        })
        .flat()
    })
  }
}
