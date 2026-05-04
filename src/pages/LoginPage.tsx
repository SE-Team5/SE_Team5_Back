import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { authService } from '@/services/authService'
import { toast } from 'sonner'
import { Book, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Password reset modal
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetUsername, setResetUsername] = useState('')
  const [resetEmail, setResetEmail] = useState('')
  const [isResetting, setIsResetting] = useState(false)

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim() || !password.trim()) {
      toast.error('아이디와 비밀번호를 입력해주세요.')
      return
    }
    
    setIsLoading(true)
    try {
      const success = await login(username, password)
      if (success) {
        toast.success('로그인되었습니다.')
        navigate('/')
      } else {
        toast.error('아이디 또는 비밀번호가 올바르지 않습니다.')
      }
    } catch {
      toast.error('로그인 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!resetUsername.trim()) {
      toast.error('아이디를 입력해주세요.')
      return
    }
    
    if (!resetEmail.trim()) {
      toast.error('이메일을 입력해주세요.')
      return
    }
    
    setIsResetting(true)
    try {
      const result = await authService.resetPassword(resetUsername, resetEmail)
      if (result.success) {
        toast.success(result.message)
        setShowResetModal(false)
        setResetUsername('')
        setResetEmail('')
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('비밀번호 재설정 중 오류가 발생했습니다.')
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <Book className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">영단어 퀴즈</h1>
          <p className="text-muted-foreground mt-2">로그인하여 학습을 시작하세요</p>
        </div>

        {/* Login Form */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
                아이디
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="아이디를 입력하세요"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                비밀번호
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="비밀번호를 입력하세요"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  로그인 중...
                </>
              ) : (
                '로그인'
              )}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between text-sm">
            <button
              onClick={() => setShowResetModal(true)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              비밀번호 초기화
            </button>
            <Link
              to="/register"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              회원가입
            </Link>
          </div>
        </div>

        {/* Demo account info removed as requested */}
      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-sm shadow-lg">
            <h2 className="text-lg font-bold text-foreground mb-4">비밀번호 초기화</h2>
            <p className="text-sm text-muted-foreground mb-4">
              가입 시 등록한 아이디와 이메일을 입력해주세요.
            </p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label htmlFor="resetUsername" className="block text-sm font-medium text-foreground mb-2">
                  아이디
                </label>
                <input
                  id="resetUsername"
                  type="text"
                  value={resetUsername}
                  onChange={(e) => setResetUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="아이디를 입력하세요"
                />
              </div>
              <div>
                <label htmlFor="resetEmail" className="block text-sm font-medium text-foreground mb-2">
                  이메일
                </label>
                <input
                  id="resetEmail"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="가입한 이메일을 입력하세요"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(false)
                    setResetUsername('')
                    setResetEmail('')
                  }}
                  className="flex-1 py-3 rounded-lg border border-border text-foreground font-medium hover:bg-secondary transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isResetting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    '전송'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
