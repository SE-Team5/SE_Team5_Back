import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { quizService, type QuizQuestion } from '@/services/quizService'
import { dashboardService } from '@/services/dashboardService'
import { cn } from '@/lib/utils'
import { Loader2, CheckCircle2, XCircle, ArrowRight, Trophy, RotateCcw } from 'lucide-react'

type QuizState = 'loading' | 'question' | 'feedback' | 'result'

export default function QuizPage() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()

  const [state, setState] = useState<QuizState>('loading')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [correctCount, setCorrectCount] = useState(0)

  const currentQuestion = questions[currentIndex]
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0

  useEffect(() => {
    loadQuiz()
  }, [])

  const loadQuiz = async () => {
    setState('loading')
    try {
      const wordCount = user?.quizWordCount || 10
      const quizQuestions = await quizService.generateQuiz(wordCount)
      setQuestions(quizQuestions)
      setState('question')
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
    setState('feedback')
  }

  const handleSelectOption = (option: string) => {
    setUserAnswer(option)
    
    const correct = quizService.checkAnswer(currentQuestion, option)
    setIsCorrect(correct)
    if (correct) {
      setCorrectCount(prev => prev + 1)
    }
    setState('feedback')
  }

  const handleNextQuestion = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setUserAnswer('')
      setIsCorrect(null)
      setState('question')
    } else {
      if (user?.id) {
        try {
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
        } catch (error) {
          console.error('Failed to submit quiz result:', error)
        }
      }

      // Quiz completed
      updateUser({ todayQuizCompleted: true })
      setState('result')
    }
  }

  const handleRetry = () => {
    setCurrentIndex(0)
    setUserAnswer('')
    setIsCorrect(null)
    setCorrectCount(0)
    loadQuiz()
  }

  const getQuestionText = () => {
    if (!currentQuestion) return ''
    
    const { type, word } = currentQuestion
    if (type.startsWith('korean-to-english')) {
      return word.korean
    } else {
      return word.english
    }
  }

  const getQuestionLabel = () => {
    if (!currentQuestion) return ''
    
    const { type } = currentQuestion
    if (type.startsWith('korean-to-english')) {
      return '다음 한국어 뜻에 해당하는 영단어는?'
    } else {
      return '다음 영단어의 한국어 뜻은?'
    }
  }

  const isChoiceType = currentQuestion?.type.endsWith('choice')

  // Loading State
  if (state === 'loading') {
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
  if (state === 'result') {
    const percentage = Math.round((correctCount / questions.length) * 100)
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
              <Trophy className="h-10 w-10 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">퀴즈 완료!</h1>
            <p className="text-muted-foreground mb-6">수고하셨습니다</p>
            
            <div className="bg-secondary/50 rounded-xl p-6 mb-6">
              <p className="text-4xl font-bold text-foreground mb-2">
                {correctCount} / {questions.length}
              </p>
              <p className="text-muted-foreground">정답률 {percentage}%</p>
            </div>

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
          <p className="text-3xl font-bold text-foreground text-center py-8">
            {getQuestionText()}
          </p>
        </div>

        {/* Answer Section */}
        {state === 'question' && (
          <>
            {isChoiceType ? (
              // Multiple Choice
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
              // Text Input
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

        {/* Feedback Section */}
        {state === 'feedback' && (
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
    </div>
  )
}
