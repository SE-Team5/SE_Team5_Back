export function getApiBaseUrl(defaultPath: string): string {
  const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim()

  if (configuredBase) {
    return configuredBase.replace(/\/$/, '')
  }

  if (import.meta.env.PROD) {
    return defaultPath
  }

  return 'http://localhost:5000/api'
}

export function getApiBaseCandidates(defaultPath: string): string[] {
  const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim()?.replace(/\/$/, '')
  const candidates = [
    configuredBase,
    defaultPath.replace(/\/$/, ''),
    'http://localhost:5000/api',
    '/_/backend/api',
  ]

  return candidates.filter((value, index, array): value is string => Boolean(value) && array.indexOf(value) === index)
}

export async function requestJson<T>(defaultPath: string, path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('vocab_quiz_token') : null
  let lastError: unknown = null

  for (const baseUrl of getApiBaseCandidates(defaultPath)) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options?.headers || {}),
        },
        ...options,
      })

      const rawBody = await response.text()
      let data: unknown = {}

      if (rawBody.trim().length > 0) {
        try {
          data = JSON.parse(rawBody)
        } catch {
          const message = `Invalid JSON response from ${baseUrl}${path}`
          if (response.status === 404 || response.status === 405 || response.status === 502 || response.ok) {
            lastError = new Error(message)
            continue
          }
          throw new Error(message)
        }
      }

      if (response.ok) {
        return data as T
      }

      const responseData = data as { message?: unknown }
      const message = typeof responseData?.message === 'string' ? responseData.message : 'Request failed'
      if (response.status === 404 || response.status === 405 || response.status === 502) {
        lastError = new Error(message)
        continue
      }

      throw new Error(message)
    } catch (error) {
      lastError = error
    }
  }

  if (lastError instanceof Error) {
    throw lastError
  }

  throw new Error('Request failed')
}