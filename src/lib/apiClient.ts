// src/lib/apiClient.ts
export async function fetchWithAuth(input: string, init: RequestInit = {}) {
  // En SSR no hay localStorage, así que lanzamos un error suave o devolvemos algo
  if (typeof window === 'undefined') {
    // Opcional: podrías devolver una respuesta vacía si quisieras soportar SSR
    throw new Error('fetchWithAuth solo se usa en el cliente')
  }

  const token = localStorage.getItem('token')
  const headers = new Headers(init.headers || {})

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return fetch(input, {
    ...init,
    headers,
  })
}
