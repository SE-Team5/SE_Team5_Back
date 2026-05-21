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