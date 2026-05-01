import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Book, Gamepad2, Trophy, Calendar, CheckCircle2, XCircle } from 'lucide-react'

export default function MainPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            안녕하세요, <span className="text-primary">{user?.nickname || user?.username}</span>님!
          </h1>
          <p className="text-muted-foreground">오늘도 영단어 학습을 시작해볼까요?</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Consecutive Days */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">연속 출석</p>
                <p className="text-2xl font-bold text-foreground">
                  {user?.consecutiveDays || 0}일
                </p>
              </div>
            </div>
            {(user?.consecutiveDays || 0) > 0 && (
              <div className="mt-4 p-3 bg-warning/10 rounded-lg">
                <p className="text-sm text-warning font-medium flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  {user?.consecutiveDays}일 연속 출석 중!
                </p>
              </div>
            )}
          </div>

          {/* Today's Quiz Status */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                user?.todayQuizCompleted ? 'bg-success/20' : 'bg-destructive/20'
              }`}>
                {user?.todayQuizCompleted ? (
                  <CheckCircle2 className="h-6 w-6 text-success" />
                ) : (
                  <XCircle className="h-6 w-6 text-destructive" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">오늘의 퀴즈</p>
                <p className="text-2xl font-bold text-foreground">
                  {user?.todayQuizCompleted ? '완료' : '미완료'}
                </p>
              </div>
            </div>
            {!user?.todayQuizCompleted && (
              <Link
                to="/game"
                className="mt-4 block text-center py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                퀴즈 시작하기
              </Link>
            )}
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Wordbook Card */}
          <Link
            to="/wordbook"
            className="group bg-card rounded-2xl border border-border p-6 shadow-sm hover:border-primary/50 hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Book className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground mb-1">단어장 보기</h3>
                <p className="text-sm text-muted-foreground">
                  등록된 모든 영단어를 확인하고 학습하세요
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <span className="text-sm text-primary font-medium group-hover:underline">
                단어장 열기 &rarr;
              </span>
            </div>
          </Link>

          {/* Game Card */}
          <Link
            to="/game"
            className="group bg-card rounded-2xl border border-border p-6 shadow-sm hover:border-accent/50 hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                <Gamepad2 className="h-7 w-7 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground mb-1">단어 퀴즈</h3>
                <p className="text-sm text-muted-foreground">
                  재미있는 퀴즈로 영단어를 복습하세요
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <span className="text-sm text-accent font-medium group-hover:underline">
                게임 시작 &rarr;
              </span>
            </div>
          </Link>
        </div>

        </div>
    </div>
  )
}
