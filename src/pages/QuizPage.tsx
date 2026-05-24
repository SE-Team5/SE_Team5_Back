import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { quizService, type QuizQuestion, type DateFilter } from '@/services/quizService'
import { dashboardService } from '@/services/dashboardService'
import { cn } from '@/lib/utils'
import { Loader2, CheckCircle2, XCircle, ArrowRight, Trophy, RotateCcw } from 'lucide-react'
import PetCheer from '@/components/PetCheer'
import MatchingQuiz from '@/components/MatchingQuiz'
import { petService, getPetImage, getPetStageName } from '@/services/petService'

type QuizState = 'loading' | 'question' | 'feedback' | 'result'

export default function QuizPage() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { wordCount?: number; dateFilter?: DateFilter } | null

  const [quizState, setQuizState] = useState<QuizState>('loading')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [showCheer, setShowCheer] = useState(false)
  const [cheerMessage, setCheerMessage] = useState('')
  const [matchingDone, setMatchingDone] = useState(false)

  // 퀴즈 결과 화면 - 펫 연출용 상태
  const [prevPetLevel, setPrevPetLevel] = useState(1)
  const [newPetLevel, setNewPetLevel] = useState(1)
  const [petResultMessage, setPetResultMessage] = useState('')
  const [showPetSection, setShowPetSection] = useState(false)
  const [animateXP, setAnimateXP] = useState(false)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [petImgError, setPetImgError] = useState(false)

  const currentQuestion = questions[currentIndex]
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0

  useEffect(() => {
    loadQuiz()
  }, [])

  // 퀴즈 완료 시 펫 연출 애니메이션 시퀀스
  useEffect(() => {
    if (quizState !== 'result') return
    const t1 = setTimeout(() => setShowPetSection(true), 300)
    const t2 = setTimeout(() => setAnimateXP(true), 900)
    const t3 = setTimeout(() => setShowLevelUp(true), 1800)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [quizState])

  const loadQuiz = async () => {
    setQuizState('loading')
    try {
      const wordCount = state?.wordCount || user?.quizWordCount || 10
      const dateFilter = state?.dateFilter || 'all'
      const userNo = user?.id ? Number(user.id) : undefined
      const quizQuestions = await quizService.generateQuiz(wordCount, userNo, dateFilter)
      setQuestions(quizQuestions)
      setQuizState('question')
    } catch (error) {
      console.error('Failed to load quiz:', error)
    }
  }

  const handleSubmitAnswer = () => {
    if (!currentQuestion || !userAnswer.trim()) return

    const correct = quizService.checkAnswer(currentQuestion, userAnswer)
    setIsCorrect(correct)
    if (correct) {
      setCorrectCount(prev => prev + 1)
    }
    setQuizState('feedback')
  }

  const handleSelectOption = (option: string) => {
    setUserAnswer(option)
    
    const correct = quizService.checkAnswer(currentQuestion, option)
    setIsCorrect(correct)
    if (correct) {
      setCorrectCount(prev => prev + 1)
    }
    setQuizState('feedback')
  }

  const handleNextQuestion = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setUserAnswer('')
      setIsCorrect(null)
      setMatchingDone(false)
      setQuizState('question')

      // 30% chance to show cheer message
      if (Math.random() < 0.3) {
        const message = petService.getRandomCheerMessage()
        setCheerMessage(message)
        setShowCheer(true)
      }
    } else {
      if (user?.id) {
        try {
          // 1) 제출 전 현재 펫 레벨 캡처
          const prevStatus = await petService.getPetStatus(Number(user.id))
          setPrevPetLevel(prevStatus.pet_level)

          await quizService.submitQuizResult(
            {
              totalQuestions: questions.length,
              correctAnswers: correctCount,
              answers: [],
            },
            Number(user.id)
          )

          const dashboardResult = await dashboardService.getStatus(Number(user.id))
          if (dashboardResult.status === 'success' && dashboardResult.data) {
            updateUser({
              consecutiveDays: dashboardResult.data.attendance_streak,
              todayQuizCompleted: dashboardResult.data.today_quiz_completed,
            })
          } else {
            updateUser({ todayQuizCompleted: true })
          }

          // 2) 펫 레벨 업데이트 후 새 레벨 캡처
          const updateResult = await petService.updatePetLevel(Number(user.id), true)
          setNewPetLevel(updateResult.pet_level)

          // 3) 응원 메시지 가져오기
          const cheerResult = await petService.getCheerMessage()
          setPetResultMessage(cheerResult.message)
        } catch (error) {
          console.error('Failed to submit quiz result:', error)
        }
      }

      // Quiz completed
      updateUser({ todayQuizCompleted: true })
      setQuizState('result')
    }
  }

  const handleRetry = () => {
    setCurrentIndex(0)
    setUserAnswer('')
    setIsCorrect(null)
    setCorrectCount(0)
    setMatchingDone(false)
    // 펫 연출 상태 초기화
    setPrevPetLevel(1)
    setNewPetLevel(1)
    setPetResultMessage('')
    setShowPetSection(false)
    setAnimateXP(false)
    setShowLevelUp(false)
    setPetImgError(false)
    loadQuiz()
  }

  const getQuestionText = () => {
    if (!currentQuestion) return ''
    const { type, word } = currentQuestion
    if (type === 'matching') return ''
    return type.startsWith('korean-to-english') ? word.korean : word.english
  }

  const getQuestionLabel = () => {
    if (!currentQuestion) return ''
    const { type } = currentQuestion
    if (type === 'matching') return '알맞은 영단어와 한국어 뜻을 연결하세요'
    return type.startsWith('korean-to-english')
      ? '다음 한국어 뜻에 해당하는 영단어는?'
      : '다음 영단어의 한국어 뜻은?'
  }

  const isMatchingType = currentQuestion?.type === 'matching'
  const isChoiceType = !isMatchingType && currentQuestion?.type.endsWith('choice')

  // Loading State
  if (quizState === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">퀴즈를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // Result State
  if (quizState === 'result') {
    const percentage = Math.round((correctCount / questions.length) * 100)
    const prevXP = Math.round((prevPetLevel / 10) * 100)
    const newXP  = Math.round((newPetLevel  / 10) * 100)
    const leveledUp = newPetLevel > prevPetLevel

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">

          {/* ── 점수 카드 ─────────────────────────────────── */}
          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm text-center">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
              <Trophy className="h-10 w-10 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">퀴즈 완료!</h1>
            <p className="text-muted-foreground mb-6">수고하셨습니다</p>
            <div className="bg-secondary/50 rounded-xl p-6">
              <p className="text-4xl font-bold text-foreground mb-1">
                {correctCount} / {questions.length}
              </p>
              <p className="text-muted-foreground">정답률 {percentage}%</p>
            </div>
          </div>

          {/* ── 펫 응원 + XP 카드 (딜레이 후 fade-in) ────── */}
          <div
            className={cn(
              'bg-card rounded-2xl border border-border p-6 shadow-sm transition-all duration-700',
              showPetSection ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'
            )}
          >
            {/* 펫 이미지 + 말풍선 */}
            <div className="flex items-end gap-4 mb-5">
              {/* 식물 이미지 */}
              <div className="relative flex-shrink-0">
                {showLevelUp && leveledUp && (
                  <span
                    className="
                      absolute -top-4 left-1/2 -translate-x-1/2
                      bg-warning text-warning-foreground
                      text-[11px] font-extrabold
                      px-2 py-0.5 rounded-full shadow-md
                      animate-bounce whitespace-nowrap
                    "
                  >
                    LEVEL UP! 🎉
                  </span>
                )}
                {!petImgError ? (
                  <img
                    src={getPetImage(newPetLevel)}
                    alt="LIVO 식물"
                    className="h-24 w-auto object-contain pet-sway drop-shadow-lg"
                    onError={() => setPetImgError(true)}
                  />
                ) : (
                  <span className="text-7xl leading-none pet-sway drop-shadow-lg block">
                    {newPetLevel >= 7 ? '🌸' : newPetLevel >= 4 ? '🌿' : '🌱'}
                  </span>
                )}
              </div>

              {/* 말풍선 */}
              {petResultMessage && (
                <div className="relative bg-primary/10 border border-primary/20 rounded-2xl rounded-bl-sm px-4 py-3 flex-1">
                  <p className="text-sm font-medium text-foreground leading-relaxed">
                    {petResultMessage}
                  </p>
                  {/* 꼬리 */}
                  <div
                    className="
                      absolute bottom-3 -left-2
                      w-0 h-0
                      border-r-[10px] border-r-primary/20
                      border-t-[7px] border-t-transparent
                      border-b-[7px] border-b-transparent
                    "
                  />
                </div>
              )}
            </div>

            {/* XP 바 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted-foreground">
                  {getPetStageName(newPetLevel)} 단계
                </span>
                <div className="flex items-center gap-1.5 text-sm font-bold">
                  <span className="text-muted-foreground">Lv.{prevPetLevel}</span>
                  {leveledUp && (
                    <>
                      <ArrowRight className="h-3.5 w-3.5 text-primary" />
                      <span className="text-primary">Lv.{newPetLevel}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${animateXP ? newXP : prevXP}%`,
                    background: 'linear-gradient(to right, var(--color-success), var(--color-primary))',
                  }}
                />
              </div>

              <p className="text-xs text-muted-foreground mt-1 text-right">
                Lv.{newPetLevel} / 10
              </p>
            </div>
          </div>

          {/* ── 액션 버튼 ─────────────────────────────────── */}
          <div className="flex gap-3">
            <button
              onClick={handleRetry}
              className="flex-1 py-3 rounded-lg border border-border text-foreground font-medium hover:bg-secondary transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="h-5 w-5" />
              다시 풀기
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              메인으로
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              {currentIndex + 1} / {questions.length}
            </span>
            <span className="text-sm font-medium text-primary">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm mb-6">
          <p className="text-sm text-muted-foreground mb-4">{getQuestionLabel()}</p>
          {!isMatchingType && (
            <p className="text-3xl font-bold text-foreground text-center py-8">
              {getQuestionText()}
            </p>
          )}
        </div>

        {/* Answer Section */}
        {quizState === 'question' && (
          <>
            {isMatchingType ? (
              // ── 줄 잇기 매칭 게임 ──────────────────────────
              <div className="space-y-4">
                <MatchingQuiz
                  pairs={currentQuestion.matchingPairs!}
                  onComplete={(allCorrect) => {
                    if (allCorrect) setCorrectCount(prev => prev + 1)
                    setIsCorrect(allCorrect)
                    setMatchingDone(true)
                  }}
                />

                {/* 매칭 완료 후 다음 문제 버튼 */}
                {matchingDone && (
                  <button
                    onClick={handleNextQuestion}
                    className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    {currentIndex < questions.length - 1 ? (
                      <>다음 문제<ArrowRight className="h-5 w-5" /></>
                    ) : (
                      '결과 보기'
                    )}
                  </button>
                )}
              </div>
            ) : isChoiceType ? (
              // ── 객관식 ─────────────────────────────────────
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentQuestion.options?.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectOption(option)}
                    className="py-4 px-6 rounded-xl border border-border bg-card text-foreground font-medium hover:border-primary hover:bg-primary/5 transition-colors text-left"
                  >
                    <span className="text-muted-foreground mr-2">{index + 1}.</span>
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              // ── 주관식 입력 ─────────────────────────────────
              <div className="space-y-4">
                <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitAnswer()}
                  className="w-full px-6 py-4 rounded-xl border border-input bg-background text-foreground text-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="답을 입력하세요"
                  autoFocus
                />
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!userAnswer.trim()}
                  className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  제출
                </button>
              </div>
            )}
          </>
        )}

        {/* Feedback Section (일반 퀴즈 전용) */}
        {quizState === 'feedback' && !isMatchingType && (
          <div className="space-y-4">
            <div
              className={cn(
                'p-6 rounded-xl border',
                isCorrect
                  ? 'bg-success/10 border-success/30'
                  : 'bg-destructive/10 border-destructive/30'
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                {isCorrect ? (
                  <CheckCircle2 className="h-6 w-6 text-success" />
                ) : (
                  <XCircle className="h-6 w-6 text-destructive" />
                )}
                <span className={cn(
                  'text-lg font-bold',
                  isCorrect ? 'text-success' : 'text-destructive'
                )}>
                  {isCorrect ? '정답입니다!' : '오답입니다'}
                </span>
              </div>
              {!isCorrect && (
                <p className="text-foreground">
                  정답: <span className="font-bold">{currentQuestion.correctAnswer}</span>
                </p>
              )}
              {currentQuestion.word.example && (
                <p className="mt-3 text-sm text-muted-foreground italic">
                  예문: {currentQuestion.word.example}
                </p>
              )}
            </div>

            <button
              onClick={handleNextQuestion}
              className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              {currentIndex < questions.length - 1 ? (
                <>
                  다음 문제
                  <ArrowRight className="h-5 w-5" />
                </>
              ) : (
                '결과 보기'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Pet Cheer Popup */}
      {showCheer && (
        <PetCheer
          message={cheerMessage}
          onClose={() => setShowCheer(false)}
        />
      )}
    </div>
  )
}
