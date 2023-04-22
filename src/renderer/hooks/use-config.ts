import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

export function useConfigModel() {
  const queryClient = useQueryClient()

  const query = useQuery(['config', 'model'], () =>
    api.invoke('config:read:model')
  )

  const mutation = useMutation(
    async (model: string) => api.send('config:write:model', model),
    {
      onSuccess: () => queryClient.invalidateQueries(['config', 'model'])
    }
  )

  return {
    query,
    mutation
  }
}

export function useConfigOpenAPIKey() {
  const queryClient = useQueryClient()

  const query = useQuery(['config', 'open-api-key'], () =>
    api.invoke('config:read:openai-api-key')
  )

  const mutation = useMutation(
    async (key: string) => api.send('config:write:openai-api-key', key),
    {
      onSuccess: () => queryClient.invalidateQueries(['config', 'open-api-key'])
    }
  )

  return {
    query,
    mutation
  }
}
