import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

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
  logout: () => void
  register: (username: string, password: string, email: string, pushNotificationEnabled: boolean, nickname?: string) => Promise<boolean>
  updateUser: (updates: Partial<User>) => void
  deleteAccount: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = 'vocab_quiz_user'

// Mock registered users (In real app, this would be in backend)
const mockUsers: Map<string, { password: string; user: User }> = new Map([
  ['admin', {
    password: 'admin1234',
    user: {
      id: 'admin-001',
      username: 'admin',
      nickname: '관리자',
      email: 'admin@example.com',
      role: 'ADMIN',
      quizWordCount: 10,
      consecutiveDays: 0,
      todayQuizCompleted: false,
      pushNotificationEnabled: false
    }
  }]
])

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
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    const storedUser = mockUsers.get(username)
    if (storedUser && storedUser.password === password) {
      const userData = { ...storedUser.user }
      setUser(userData)
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(userData))
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    sessionStorage.removeItem(STORAGE_KEY)
  }

  const register = async (
    username: string,
    password: string,
    email: string,
    pushNotificationEnabled: boolean,
    nickname?: string
  ): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // Check if username already exists
    if (mockUsers.has(username)) {
      return false
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      username,
      nickname: nickname || username,
      email,
      role: 'USER',
      quizWordCount: 10,
      consecutiveDays: 0,
      todayQuizCompleted: false,
      pushNotificationEnabled
    }

    mockUsers.set(username, { password, user: newUser })
    return true
  }

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates }
      setUser(updatedUser)
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser))
      
      // Update mock storage too
      const stored = mockUsers.get(user.username)
      if (stored) {
        mockUsers.set(user.username, { ...stored, user: updatedUser })
      }
    }
  }

  const deleteAccount = () => {
    if (user) {
      mockUsers.delete(user.username)
      logout()
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
