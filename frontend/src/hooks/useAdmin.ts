import { useMutation } from '@tanstack/react-query'
import { adminApi } from '@/lib/api/admin'

export function useExpireSubscriptions() {
  return useMutation({
    mutationFn: () => adminApi.expireSubscriptions(),
  })
}
