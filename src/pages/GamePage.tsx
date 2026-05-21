import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { quizService, type GameRecord, type GameStatistics, type DateFilter } from '@/services/quizService'
import { toast } from 'sonner'
import { Gamepad2, Brain, Target, Trophy, BarChart3, Calendar, TrendingUp, Clock } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'

type TabType = 'history' | 'start'

export default function GamePage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('start')
  const [gameHistory, setGameHistory] = useState<GameRecord[]>([])
  const [gameStats, setGameStats] = useState<GameStatistics>({
    totalGames: 0,
    totalWordsPlayed: 0,
    totalCorrect: 0,
    avgAccuracy: 0
  })
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState<DateFilter>('all')
  const userNo = user?.id ? Number(user.id) : undefined

  useEffect(() => {
    if (activeTab === 'history' && userNo) {
      loadGameData()
    }
  }, [activeTab, userNo])

  const loadGameData = async () => {
    if (!userNo) return

    setIsLoading(true)
    try {
      const [history, stats] = await Promise.all([
        quizService.getGameHistory(userNo, 20),
        quizService.getGameStatistics(userNo)
      ])
      setGameHistory(history)
      setGameStats(stats)
    } catch (error) {
      toast.error('게임 이력을 불러올 수 없습니다.')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return `오늘 ${date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `어제 ${date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`
    }
    return date.toLocaleDateString('ko-KR')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="start">퀴즈 시작</TabsTrigger>
            <TabsTrigger value="history">게임 이력</TabsTrigger>
          </TabsList>

          {/* Tab 1: Start Quiz */}
          <TabsContent value="start" className="space-y-8">
            {/* Quiz Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <div className="bg-card rounded-2xl border border-border p-6">
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

            {/* Word Filter Selection */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">단어 선택</h2>
              <p className="text-sm text-muted-foreground mb-4">어떤 단어로 퀴즈를 진행하시겠어요?</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <button
                  onClick={() => setSelectedFilter('today')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedFilter === 'today'
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <Calendar className="h-6 w-6 mx-auto mb-2" />
                  <p className="font-medium">오늘 배운 단어</p>
                  <p className="text-xs mt-1">Today</p>
                </button>
                <button
                  onClick={() => setSelectedFilter('week')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedFilter === 'week'
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <TrendingUp className="h-6 w-6 mx-auto mb-2" />
                  <p className="font-medium">최근 일주일</p>
                  <p className="text-xs mt-1">Last 7 Days</p>
                </button>
                <button
                  onClick={() => setSelectedFilter('all')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedFilter === 'all'
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <Brain className="h-6 w-6 mx-auto mb-2" />
                  <p className="font-medium">전체 단어</p>
                  <p className="text-xs mt-1">All Words</p>
                </button>
              </div>
            </div>

            {/* Start Button */}
            <Link
              to="/quiz"
              state={{ wordCount: user?.quizWordCount || 10, dateFilter: selectedFilter }}
              className="block w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg text-center hover:bg-primary/90 transition-colors"
            >
              퀴즈 시작
            </Link>

            {/* Settings Link */}
            <p className="text-center text-sm text-muted-foreground">
              문제 수를 변경하려면{' '}
              <Link to="/mypage" className="text-primary hover:underline">
                마이페이지
              </Link>
              에서 설정하세요.
            </p>
          </TabsContent>

          {/* Tab 2: Game History */}
          <TabsContent value="history" className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Card className="p-4 text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 mb-2">
                  <Gamepad2 className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">총 게임 수</p>
                <p className="text-2xl font-bold text-foreground">{gameStats.totalGames}</p>
              </Card>
              <Card className="p-4 text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10 mb-2">
                  <Brain className="h-5 w-5 text-accent" />
                </div>
                <p className="text-sm text-muted-foreground">풀이한 단어</p>
                <p className="text-2xl font-bold text-foreground">{gameStats.totalWordsPlayed}</p>
              </Card>
              <Card className="p-4 text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-success/10 mb-2">
                  <Trophy className="h-5 w-5 text-success" />
                </div>
                <p className="text-sm text-muted-foreground">정답 수</p>
                <p className="text-2xl font-bold text-foreground">{gameStats.totalCorrect}</p>
              </Card>
              <Card className="p-4 text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-warning/10 mb-2">
                  <BarChart3 className="h-5 w-5 text-warning" />
                </div>
                <p className="text-sm text-muted-foreground">평균 정답률</p>
                <p className="text-2xl font-bold text-foreground">{gameStats.avgAccuracy.toFixed(1)}%</p>
              </Card>
            </div>

            {/* Game History List */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                최근 게임 이력
              </h2>

              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">로딩 중...</p>
                </div>
              ) : gameHistory.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {gameHistory.map((record, index) => (
                    <div key={record.id} className="flex items-center justify-between p-4 rounded-lg bg-background border border-border/50 hover:border-border transition-colors">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-sm font-medium text-muted-foreground w-8">#{index + 1}</div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {record.correctAnswers} / {record.totalWords}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(record.playedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          record.accuracyRate >= 80 ? 'text-success' :
                          record.accuracyRate >= 60 ? 'text-warning' :
                          'text-destructive'
                        }`}>
                          {record.accuracyRate}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">게임 이력이 없습니다.</p>
                  <p className="text-sm text-muted-foreground mt-2">퀴즈를 풀어보세요!</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
