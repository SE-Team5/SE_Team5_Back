import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { dayWordService, type DayWord } from '@/services/dayWordService'
import { Loader2, Sparkles } from 'lucide-react'
import DayWordCard from '@/components/DayWordCard'

export default function DayWordBookPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [dayWords, setDayWords] = useState<DayWord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDayWords()
  }, [user?.id])

  const loadDayWords = async () => {
    if (!user?.id) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const userId = Number(user.id)
      const response = await dayWordService.getDayWords(userId, 1, 100)
      setDayWords(response.items || [])
    } catch (err) {
      console.error('Failed to load day words:', err)
      setError('오늘의 단어를 불러올 수 없습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleCard = (id: number) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const handleReviewGame = () => {
    navigate('/game')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">오늘의 단어를 준비하고 있습니다...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">오늘의 단어 학습</h1>
          </div>
          <p className="text-muted-foreground">
            총 {dayWords.length}개의 단어를 학습하세요
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!error && dayWords.length === 0 && (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-foreground font-medium mb-2">오늘의 단어가 없습니다</p>
            <p className="text-sm text-muted-foreground">
              나중에 다시 확인해주세요
            </p>
          </div>
        )}

        {/* Word Cards */}
        {dayWords.length > 0 && (
          <div className="space-y-0 mb-12">
            {dayWords.map((dayWord) => (
              <DayWordCard
                key={dayWord.id}
                dayWord={dayWord}
                isExpanded={expandedId === dayWord.id}
                onToggle={() => handleToggleCard(dayWord.id)}
              />
            ))}
          </div>
        )}

        {/* Review Game Button */}
        {dayWords.length > 0 && (
          <div className="sticky bottom-4 flex gap-4">
            <button
              onClick={handleReviewGame}
              className="flex-1 py-4 px-6 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl"
            >
              복습 게임
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
