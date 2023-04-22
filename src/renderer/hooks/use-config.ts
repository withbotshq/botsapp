import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

export function useConfigModel() {
  const queryClient = useQueryClient()

  const modelQuery = useQuery(['config', 'model'], () =>
    api.invoke('config:read:model')
  )

  const modelMutation = useMutation(
    async (model: string) => api.send('config:write:model', model),
    {
      onSuccess: () => queryClient.invalidateQueries(['config', 'model'])
    }
  )

  return {
    query: modelQuery,
    mutation: modelMutation
  }
}
