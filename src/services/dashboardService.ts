// Dashboard Service - calls backend /api/dashboard/status

const API_BASE_URL = 'http://localhost:5000/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const storedToken = typeof window !== 'undefined' ? sessionStorage.getItem('vocab_quiz_token') : null
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(storedToken ? { Authorization: `Bearer ${storedToken}` } : {}),
      ...(options?.headers || {})
    },
    ...options,
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok && !data) throw new Error('Request failed')
  return data as T
}

export interface DashboardStatusResponse {
  status: 'success' | 'error'
  data?: {
    attendance_streak: number
    attendance_today: boolean
    today_quiz_completed: boolean
  }
  message?: string
}

export const dashboardService = {
  async getStatus(userNo: number): Promise<DashboardStatusResponse> {
    return request<DashboardStatusResponse>(`/dashboard/status?userNo=${encodeURIComponent(userNo)}`)
  }
}
