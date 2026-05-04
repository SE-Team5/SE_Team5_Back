import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { authService } from '@/services/authService'
import { dashboardService } from '@/services/dashboardService'

export type UserRole = 'ADMIN' | 'USER'

export interface User {
  id: string
  username: string
  nickname: string
  email: string
  role: UserRole
  quizWordCount: number
  consecutiveDays: number
  todayQuizCompleted: boolean
  pushNotificationEnabled: boolean
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  register: (username: string, password: string, email: string, pushNotificationEnabled: boolean, nickname?: string) => Promise<{ success: boolean; message?: string }>
  updateUser: (updates: Partial<User>) => void
  deleteAccount: () => Promise<{ success: boolean; message?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = 'vocab_quiz_user'
const TOKEN_KEY = 'vocab_quiz_token'

function buildUserFromBackend(data: {
  id?: number | string
  username: string
  nickname?: string
  email: string
  role: 'ADMIN' | 'USER' | 'admin' | 'user'
  pushNotificationEnabled?: boolean
}): User {
  const normalizedRole: UserRole = data.role.toLowerCase() === 'admin' ? 'ADMIN' : 'USER'

  return {
    id: String(data.id ?? data.username),
    username: data.username,
    nickname: data.nickname ?? data.username,
    email: data.email,
    role: normalizedRole,
    quizWordCount: 10,
    consecutiveDays: 0,
    todayQuizCompleted: false,
    pushNotificationEnabled: data.pushNotificationEnabled ?? false
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        sessionStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    const result = await authService.login({ username, password })

    if (result.success && result.user) {
      const userData = buildUserFromBackend(result.user)

      let nextUser = userData

      const userNo = Number(result.user.id)
      if (Number.isFinite(userNo)) {
        try {
          const dashboardResult = await dashboardService.getStatus(userNo)
          const dashboardData = dashboardResult.data

          if (dashboardResult.status === 'success' && dashboardData) {
            nextUser = {
              ...userData,
              consecutiveDays: dashboardData.attendance_streak ?? userData.consecutiveDays,
              todayQuizCompleted: dashboardData.today_quiz_completed ?? userData.todayQuizCompleted,
            }
          }
        } catch {
          // 대시보드 상태는 로그인 성공을 막지 않는다.
        }
      }

      setUser(nextUser)
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser))
      if (result.token) {
        sessionStorage.setItem(TOKEN_KEY, result.token)
      }
      return true
    }
    return false
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch {
      // ignore network errors, still clear local session
    }
    setUser(null)
    sessionStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
  }

  const register = async (
    username: string,
    password: string,
    email: string,
    pushNotificationEnabled: boolean,
    nickname?: string
  ): Promise<{ success: boolean; message?: string }> => {
    return authService.register({
      username,
      nickname,
      password,
      email,
      pushNotificationEnabled,
    })
  }

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates }
      setUser(updatedUser)
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser))
    }
  }

  const deleteAccount = async (): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await authService.deleteAccount()
      if (res.success) {
        // Clear local session without calling logout to avoid extra server call
        setUser(null)
        sessionStorage.removeItem(STORAGE_KEY)
        sessionStorage.removeItem(TOKEN_KEY)
      }
      return res
    } catch (e) {
      return { success: false, message: '회원 탈퇴 중 오류가 발생했습니다.' }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
        login,
        logout,
        register,
        updateUser,
        deleteAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
