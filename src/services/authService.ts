// Auth Service - Flask backend integration

import { requestJson } from './apiBase'

const API_BASE_URL = '/_/backend/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  return requestJson<T>(API_BASE_URL, path, options)
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  success: boolean
  token?: string
  user?: {
    id: string | number
    username: string
    nickname?: string
    email: string
    role: 'ADMIN' | 'USER'
  }
  message?: string
}

export interface CurrentUserResponse {
  success: boolean
  user?: {
    id: string | number
    username: string
    nickname?: string
    email: string
    role: 'ADMIN' | 'USER' | 'admin' | 'user'
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

  async getCurrentUser(): Promise<CurrentUserResponse> {
    return request<CurrentUserResponse>('/me', {
      method: 'GET',
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
