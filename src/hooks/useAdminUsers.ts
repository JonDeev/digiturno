import { useQuery } from '@tanstack/react-query'
import { fetchWithAuth } from '@/lib/apiClient'

export type AdminUserDTO = {
  id: string
  name: string
  username: string
  numberId: number
  role: 'ADMIN' | 'ADVISOR'
  createdAt: string
  module: { id: string; name: string } | null
}

export function useAdminUsers() {
  return useQuery<AdminUserDTO[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await fetchWithAuth('/api/admin/users')
      if (!res.ok) {
        throw new Error('Error cargando usuarios')
      }
      return res.json()
    },
    staleTime: 1000 * 10,
  })
}
