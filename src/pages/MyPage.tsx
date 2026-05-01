import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { authService } from '@/services/authService'
import { toast } from 'sonner'
import { User, Eye, EyeOff, Loader2, LogOut, Trash2 } from 'lucide-react'

export default function MyPage() {
  const { user, updateUser, logout, deleteAccount } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    nickname: user?.nickname || user?.username || '',
    password: '',
    email: user?.email || ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [quizWordCount, setQuizWordCount] = useState(user?.quizWordCount || 10)
  const [pushNotification, setPushNotification] = useState(user?.pushNotificationEnabled || false)
  const [isSaving, setIsSaving] = useState(false)

  // Email verification for change
  const [emailChanged, setEmailChanged] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [enteredCode, setEnteredCode] = useState('')
  const [isVerified, setIsVerified] = useState(true)
  const [isSendingCode, setIsSendingCode] = useState(false)

  // Delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value
    setFormData(prev => ({ ...prev, email: newEmail }))
    
    if (newEmail !== user?.email) {
      setEmailChanged(true)
      setIsVerified(false)
      setVerificationSent(false)
    } else {
      setEmailChanged(false)
      setIsVerified(true)
    }
  }

  const handleSendVerificationCode = async () => {
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
      toast.success('이메일 인증이 완료되었습니다.')
    } else {
      toast.error('인증코드가 올바르지 않습니다.')
    }
  }

  const handleSave = async () => {
    if (emailChanged && !isVerified) {
      toast.error('이메일 인증을 완료해주세요.')
      return
    }

    if (quizWordCount < 5 || quizWordCount > 30) {
      toast.error('퀴즈 단어 수는 5~30 사이여야 합니다.')
      return
    }

    setIsSaving(true)
    try {
      updateUser({
        nickname: formData.nickname,
        email: formData.email,
        quizWordCount,
        pushNotificationEnabled: pushNotification
      })
      toast.success('설정이 저장되었습니다.')
    } catch {
      toast.error('저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleDeleteAccount = () => {
    deleteAccount()
    toast.success('계정이 삭제되었습니다.')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">마이페이지</h1>
            <p className="text-muted-foreground">계정 설정을 관리하세요</p>
          </div>
        </div>

        {/* User Info (Read Only) */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-foreground mb-4">계정 정보</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                아이디
              </label>
              <div className="px-4 py-3 rounded-lg bg-secondary/50 text-foreground">
                {user?.username}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-foreground mb-4">정보 수정</h2>
          <div className="space-y-4">
            {/* Nickname */}
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-foreground mb-2">
                닉네임
              </label>
              <input
                id="nickname"
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="표시될 닉네임을 입력하세요"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                새 비밀번호
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 pr-12 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="변경할 비밀번호를 입력하세요"
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
                  onChange={handleEmailChange}
                  disabled={isVerified && emailChanged}
                  className="flex-1 px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                />
                {emailChanged && !isVerified && (
                  <button
                    type="button"
                    onClick={handleSendVerificationCode}
                    disabled={isSendingCode}
                    className="px-4 py-3 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50 whitespace-nowrap flex items-center gap-2"
                  >
                    {isSendingCode && <Loader2 className="h-4 w-4 animate-spin" />}
                    인증코드 발송
                  </button>
                )}
              </div>
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
                    onChange={(e) => setEnteredCode(e.target.value)}
                    maxLength={6}
                    className="flex-1 px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
              </div>
            )}
          </div>
        </div>

        {/* Quiz Settings */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-foreground mb-4">퀴즈 설정</h2>
          <div>
            <label htmlFor="quizWordCount" className="block text-sm font-medium text-foreground mb-2">
              퀴즈 단어 수 (5~30)
            </label>
            <input
              id="quizWordCount"
              type="number"
              min={5}
              max={30}
              value={quizWordCount}
              onChange={(e) => setQuizWordCount(Math.max(5, Math.min(30, parseInt(e.target.value) || 10)))}
              className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="mt-2 text-sm text-muted-foreground">
              퀴즈에서 출제될 단어의 개수를 설정합니다.
            </p>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-foreground mb-4">알림 설정</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">이메일 푸시 알림</p>
              <p className="text-sm text-muted-foreground">
                학습 리마인더 및 공지사항을 이메일로 받습니다
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={pushNotification}
              onClick={() => setPushNotification(!pushNotification)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                pushNotification ? 'bg-primary' : 'bg-input'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition-transform ${
                  pushNotification ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving || (emailChanged && !isVerified)}
          className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-6"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              저장 중...
            </>
          ) : (
            '저장하기'
          )}
        </button>

        {/* Logout & Delete */}
        <div className="flex gap-4">
          <button
            onClick={handleLogout}
            className="flex-1 py-3 rounded-lg border border-border text-foreground font-medium hover:bg-secondary transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="h-5 w-5" />
            로그아웃
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex-1 py-3 rounded-lg bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="h-5 w-5" />
            회원탈퇴
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-sm shadow-lg">
            <h2 className="text-lg font-bold text-foreground mb-2">회원탈퇴</h2>
            <p className="text-muted-foreground mb-6">
              정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 rounded-lg border border-border text-foreground font-medium hover:bg-secondary transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 py-3 rounded-lg bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90 transition-colors"
              >
                탈퇴하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
