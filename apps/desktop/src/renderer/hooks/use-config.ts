import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

export function useConfigModel() {
  const queryClient = useQueryClient()

  const modelQuery = useQuery({
    queryKey: ['config:model'],
    queryFn: () => api.getModel()
  })

  const modelMutation = useMutation({
    mutationFn: async (model: string) => api.setModel(model),
    onSuccess: () => queryClient.invalidateQueries(['config:model'])
  })

  return {
    query: modelQuery,
    mutation: modelMutation
  }
}
