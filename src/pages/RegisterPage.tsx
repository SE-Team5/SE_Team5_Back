import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { authService } from '@/services/authService'
import { toast } from 'sonner'
import { Book, Eye, EyeOff, Loader2, Check, X } from 'lucide-react'

export default function RegisterPage() {
  const { isAuthenticated, register } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    username: '',
    nickname: '',
    password: '',
    email: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [pushNotification, setPushNotification] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Email verification
  const [verificationSent, setVerificationSent] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [enteredCode, setEnteredCode] = useState('')
  const [isVerified, setIsVerified] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)

  // Validation errors
  const [errors, setErrors] = useState<{
    username?: string
    nickname?: string
    password?: string
    email?: string
    code?: string
  }>({})

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {}

    if (!formData.username.trim()) {
      newErrors.username = '아이디를 입력해주세요.'
    } else if (formData.username.length < 3) {
      newErrors.username = '아이디는 3자 이상이어야 합니다.'
    }

    if (!formData.nickname.trim()) {
      newErrors.nickname = '닉네임을 입력해주세요.'
    } else if (formData.nickname.length < 2) {
      newErrors.nickname = '닉네임은 2자 이상이어야 합니다.'
    }

    if (!formData.password.trim()) {
      newErrors.password = '비밀번호를 입력해주세요.'
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 6자 이상이어야 합니다.'
    } else if (!/[A-Za-z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      newErrors.password = '비밀번호는 영문과 숫자를 포함해야 합니다.'
    }

    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.'
    }

    if (verificationSent && !isVerified) {
      newErrors.code = '이메일 인증을 완료해주세요.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSendVerificationCode = async () => {
    if (!formData.email.trim()) {
      setErrors(prev => ({ ...prev, email: '이메일을 입력해주세요.' }))
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setErrors(prev => ({ ...prev, email: '올바른 이메일 형식이 아닙니다.' }))
      return
    }

    setIsSendingCode(true)
    try {
      const result = await authService.sendVerificationCode(formData.email)
      if (result.success && result.code) {
        setVerificationCode(result.code)
        setVerificationSent(true)
        toast.success('인증코드가 전송되었습니다. (테스트: 123456)')
      }
    } catch {
      toast.error('인증코드 전송에 실패했습니다.')
    } finally {
      setIsSendingCode(false)
    }
  }

  const handleVerifyCode = () => {
    if (enteredCode === verificationCode) {
      setIsVerified(true)
      setErrors(prev => ({ ...prev, code: undefined }))
      toast.success('이메일 인증이 완료되었습니다.')
    } else {
      setErrors(prev => ({ ...prev, code: '인증코드가 올바르지 않습니다.' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return
    if (!isVerified) {
      toast.error('이메일 인증을 완료해주세요.')
      return
    }

    setIsLoading(true)
    try {
      const success = await register(
        formData.username,
        formData.password,
        formData.email,
        pushNotification,
        formData.nickname
      )
      if (success) {
        toast.success('회원가입이 완료되었습니다.')
        navigate('/login')
      } else {
        toast.error('이미 사용 중인 아이디입니다.')
      }
    } catch {
      toast.error('회원가입 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
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
          <h1 className="text-2xl font-bold text-foreground">회원가입</h1>
          <p className="text-muted-foreground mt-2">새 계정을 만들어보세요</p>
        </div>

        {/* Register Form */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
                아이디
              </label>
              <input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, username: e.target.value }))
                  setErrors(prev => ({ ...prev, username: undefined }))
                }}
                className={`w-full px-4 py-3 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                  errors.username ? 'border-destructive' : 'border-input'
                }`}
                placeholder="아이디를 입력하세요"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-destructive">{errors.username}</p>
              )}
            </div>

            {/* Nickname */}
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-foreground mb-2">
                닉네임
              </label>
              <input
                id="nickname"
                type="text"
                value={formData.nickname}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, nickname: e.target.value }))
                  setErrors(prev => ({ ...prev, nickname: undefined }))
                }}
                className={`w-full px-4 py-3 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                  errors.nickname ? 'border-destructive' : 'border-input'
                }`}
                placeholder="표시될 닉네임을 입력하세요"
              />
              {errors.nickname && (
                <p className="mt-1 text-sm text-destructive">{errors.nickname}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                비밀번호
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, password: e.target.value }))
                    setErrors(prev => ({ ...prev, password: undefined }))
                  }}
                  className={`w-full px-4 py-3 pr-12 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                    errors.password ? 'border-destructive' : 'border-input'
                  }`}
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
              {errors.password && (
                <p className="mt-1 text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                이메일
              </label>
              <div className="flex gap-2">
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, email: e.target.value }))
                    setErrors(prev => ({ ...prev, email: undefined }))
                    setVerificationSent(false)
                    setIsVerified(false)
                  }}
                  disabled={isVerified}
                  className={`flex-1 px-4 py-3 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 ${
                    errors.email ? 'border-destructive' : 'border-input'
                  }`}
                  placeholder="이메일을 입력하세요"
                />
                <button
                  type="button"
                  onClick={handleSendVerificationCode}
                  disabled={isSendingCode || isVerified}
                  className="px-4 py-3 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50 whitespace-nowrap flex items-center gap-2"
                >
                  {isSendingCode ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isVerified ? (
                    <Check className="h-4 w-4" />
                  ) : null}
                  {isVerified ? '인증완료' : '인증코드 발송'}
                </button>
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            {/* Verification Code */}
            {verificationSent && !isVerified && (
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-foreground mb-2">
                  인증코드
                </label>
                <div className="flex gap-2">
                  <input
                    id="code"
                    type="text"
                    value={enteredCode}
                    onChange={(e) => {
                      setEnteredCode(e.target.value)
                      setErrors(prev => ({ ...prev, code: undefined }))
                    }}
                    maxLength={6}
                    className={`flex-1 px-4 py-3 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                      errors.code ? 'border-destructive' : 'border-input'
                    }`}
                    placeholder="6자리 인증코드"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    className="px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                  >
                    확인
                  </button>
                </div>
                {errors.code && (
                  <p className="mt-1 text-sm text-destructive">{errors.code}</p>
                )}
              </div>
            )}

            {/* Push Notification Toggle */}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-foreground">이메일 푸시 알림 수신</span>
              <button
                type="button"
                onClick={() => setPushNotification(!pushNotification)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  pushNotification ? 'bg-primary' : 'bg-input'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    pushNotification ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || !isVerified}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  가입 중...
                </>
              ) : (
                '회원가입'
              )}
            </button>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">이미 계정이 있으신가요? </span>
            <Link
              to="/login"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              로그인
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
