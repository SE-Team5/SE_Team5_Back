// Auth Service - Mock implementation
// Replace with actual API calls when connecting to Flask backend

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  success: boolean
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
  password: string
  email: string
  pushNotificationEnabled: boolean
}

export interface RegisterResponse {
  success: boolean
  message?: string
}

// Mock API functions - replace with axios calls to Flask backend
export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (data.username === 'admin' && data.password === 'admin1234') {
      return {
        success: true,
        user: {
          id: 'admin-001',
          username: 'admin',
          email: 'admin@example.com',
          role: 'ADMIN'
        }
      }
    }
    
    // For demo purposes, allow any user login
    return {
      success: false,
      message: '아이디 또는 비밀번호가 올바르지 않습니다.'
    }
  },

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return {
      success: true,
      message: '회원가입이 완료되었습니다.'
    }
  },

  async sendVerificationCode(email: string): Promise<{ success: boolean; code?: string }> {
    // Mock implementation - in real app, this would send email
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Mock verification code (in real app, this would be sent to email)
    return {
      success: true,
      code: '123456' // For testing purposes
    }
  },

  async resetPassword(username: string, email: string): Promise<{ success: boolean; message: string }> {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Mock validation - in real app, verify username and email match
    if (!username || !email) {
      return {
        success: false,
        message: '아이디와 이메일을 모두 입력해주세요.'
      }
    }
    
    return {
      success: true,
      message: '비밀번호 재설정 링크가 이메일로 전송되었습니다.'
    }
  }
}
