import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Gamepad2, Brain, Target, Trophy } from 'lucide-react'

export default function GamePage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-accent/10 mb-6">
            <Gamepad2 className="h-10 w-10 text-accent" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">단어 퀴즈</h1>
          <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
            다양한 유형의 문제로 영단어를 재미있게 학습하세요.
            <br />
            객관식과 주관식 문제가 랜덤으로 출제됩니다.
          </p>
        </div>

        {/* Quiz Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <Brain className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">문제 수</p>
            <p className="text-xl font-bold text-foreground">{user?.quizWordCount || 10}개</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <Target className="h-6 w-6 text-accent mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">문제 유형</p>
            <p className="text-xl font-bold text-foreground">4가지</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 text-center">
            <Trophy className="h-6 w-6 text-warning mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">오늘 퀴즈</p>
            <p className="text-xl font-bold text-foreground">
              {user?.todayQuizCompleted ? '완료' : '미완료'}
            </p>
          </div>
        </div>

        {/* Quiz Types Info */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4">문제 유형 안내</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center flex-shrink-0">1</span>
              <div>
                <p className="font-medium text-foreground">한국어 뜻 → 영단어 (객관식)</p>
                <p className="text-sm text-muted-foreground">한국어 뜻을 보고 4개 중 정답을 선택</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center flex-shrink-0">2</span>
              <div>
                <p className="font-medium text-foreground">한국어 뜻 → 영단어 (주관식)</p>
                <p className="text-sm text-muted-foreground">한국어 뜻을 보고 영단어를 직접 입력</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center flex-shrink-0">3</span>
              <div>
                <p className="font-medium text-foreground">영단어 → 한국어 뜻 (객관식)</p>
                <p className="text-sm text-muted-foreground">영단어를 보고 4개 중 정답을 선택</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center flex-shrink-0">4</span>
              <div>
                <p className="font-medium text-foreground">영단어 → 한국어 뜻 (주관식)</p>
                <p className="text-sm text-muted-foreground">영단어를 보고 한국어 뜻을 직접 입력</p>
              </div>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <Link
          to="/quiz"
          className="block w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg text-center hover:bg-primary/90 transition-colors"
        >
          퀴즈 시작
        </Link>

        {/* Settings Link */}
        <p className="text-center mt-4 text-sm text-muted-foreground">
          문제 수를 변경하려면{' '}
          <Link to="/mypage" className="text-primary hover:underline">
            마이페이지
          </Link>
          에서 설정하세요.
        </p>
      </div>
    </div>
  )
}
