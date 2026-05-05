// Auth Service - Flask backend integration

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
  if (!response.ok && !data) {
    throw new Error('Request failed')
  }

  return data as T
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  success: boolean
  token?: string
  user?: {
    id: string
    username: string
    email: string
    role: 'ADMIN' | 'USER'
  }
  message?: string
}

export interface RegisterRequest {
  username: string
  nickname?: string
  password: string
  email: string
  pushNotificationEnabled: boolean
}

export interface RegisterResponse {
  success: boolean
  message?: string
}

export interface VerifyEmailResponse {
  success: boolean
  message?: string
}

export interface ResetPasswordResponse {
  success: boolean
  message?: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface ChangePasswordResponse {
  success: boolean
  message?: string
}

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    return request<LoginResponse>('/login', {
      method: 'POST',
      body: JSON.stringify({
        userId: data.username,
        password: data.password,
      }),
    })
  },

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return request<RegisterResponse>('/signup', {
      method: 'POST',
      body: JSON.stringify({
        userId: data.username,
        nickname: data.nickname || data.username,
        password: data.password,
        email: data.email,
        pushAgree: data.pushNotificationEnabled,
      }),
    })
  },

  async sendVerificationCode(email: string): Promise<RegisterResponse> {
    return request<RegisterResponse>('/email/send-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  },

  async verifyEmailCode(email: string, code: string): Promise<VerifyEmailResponse> {
    return request<VerifyEmailResponse>('/email/verify', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    })
  },

  async resetPassword(username: string, email: string): Promise<ResetPasswordResponse> {
    return request<ResetPasswordResponse>('/password/reset', {
      method: 'POST',
      body: JSON.stringify({
        id: username,
        email,
      }),
    })
  },

  async changePassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    return request<ChangePasswordResponse>('/password/change', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    })
  }
  ,
  async logout(): Promise<{ success: boolean; message?: string }> {
    return request('/logout', { method: 'POST' })
  },
  async deleteAccount(): Promise<{ success: boolean; message?: string }> {
    return request('/user/delete', { method: 'POST' })
  }
}
