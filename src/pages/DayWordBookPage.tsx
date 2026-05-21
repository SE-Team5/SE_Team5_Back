import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { wordService, type Word, type WordRelation } from '@/services/wordService'
import { ArrowLeft, ChevronDown, Loader2, Sparkles, Gamepad2 } from 'lucide-react'

export default function DayWordbookPage() {
  const { user } = useAuth()
  const [words, setWords] = useState<Word[]>([])
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const userNo = user?.id ? Number(user.id) : undefined

  useEffect(() => {
    loadDailyWords()
  }, [userNo])

  const loadDailyWords = async () => {
    setIsLoading(true)
    try {
      const dailyWords = await wordService.getDailyWords(10, userNo)
      setWords(dailyWords)
    } catch (error) {
      console.error('Failed to load daily words:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => (
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    ))
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-warning" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Day 단어장</h1>
                <p className="text-muted-foreground">오늘 학습할 단어를 확인하세요</p>
                <p className="mt-1 text-sm text-muted-foreground">오늘 {words.length}개의 단어가 보여집니다</p>
              </div>
            </div>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            메인으로
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {words.map(word => {
              const expanded = expandedIds.includes(word.id)
              return (
                <button
                  key={word.id}
                  type="button"
                  onClick={() => toggleExpanded(word.id)}
                  className="w-full text-left bg-card rounded-2xl border border-border p-5 shadow-sm hover:border-primary/40 hover:shadow-md transition-all"
                >
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
                    <div>
                      <p className="text-xl font-bold text-foreground">{word.korean}</p>
                    </div>
                    <div className="hidden md:flex h-12 w-px bg-border mx-auto" />
                    <div className="md:text-right">
                      <p className="text-xl font-bold text-primary">{word.english}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                    <span>눌러서 예문을 확인하세요</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                  </div>

                  {expanded && (
                    <div className="mt-4 space-y-4 rounded-xl bg-secondary/30 p-4">
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">예문: </span>
                        {word.example || '예문이 아직 없어요.'}
                      </div>

                      <div className="space-y-3">
                        <RelationBlock label="유의어" items={word.relations?.synonym ?? []} />
                        <RelationBlock label="동의어" items={word.relations?.synonym ?? []} />
                        <RelationBlock label="반의어" items={word.relations?.antonym ?? []} />
                      </div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">이제 바로 복습해볼까요?</h2>
              <p className="text-sm text-muted-foreground">Day 단어장에서 본 단어를 퀴즈로 바로 확인할 수 있어요.</p>
            </div>
            <Link
              to="/game"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              <Gamepad2 className="h-5 w-5" />
              게임으로 복습하기
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function RelationBlock({ label, items }: { label: string; items: WordRelation[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{label}</p>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map(item => (
            <span key={item.id} className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-sm text-foreground">
              <span className="font-medium">{item.english}</span>
              <span className="text-muted-foreground">{item.korean}</span>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">등록된 {label}가 없어요.</p>
      )}
    </div>
  )
}