// Dashboard Service - calls backend /api/dashboard/status

import { requestJson } from './apiBase'

const API_BASE_URL = '/_/backend/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  return requestJson<T>(API_BASE_URL, path, options)
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
