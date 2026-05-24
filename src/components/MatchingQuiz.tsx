import { useState } from 'react'
import { type Word } from '@/services/wordService'
import { CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  pairs: Word[]           // 정확히 4개의 단어
  onComplete: (allCorrect: boolean) => void
}

// 각 연결 쌍에 사용할 색상 (Tailwind 완성형 클래스)
const PAIR_COLORS = [
  {
    base: 'bg-blue-100 border-blue-400 text-blue-800',
    correct: 'bg-green-100 border-green-400 text-green-800',
    wrong: 'bg-red-100 border-red-400 text-red-800',
  },
  {
    base: 'bg-emerald-100 border-emerald-400 text-emerald-800',
    correct: 'bg-green-100 border-green-400 text-green-800',
    wrong: 'bg-red-100 border-red-400 text-red-800',
  },
  {
    base: 'bg-violet-100 border-violet-400 text-violet-800',
    correct: 'bg-green-100 border-green-400 text-green-800',
    wrong: 'bg-red-100 border-red-400 text-red-800',
  },
  {
    base: 'bg-amber-100 border-amber-400 text-amber-800',
    correct: 'bg-green-100 border-green-400 text-green-800',
    wrong: 'bg-red-100 border-red-400 text-red-800',
  },
]

export default function MatchingQuiz({ pairs, onComplete }: Props) {
  // 오른쪽 한글 목록 — 컴포넌트 최초 렌더 시 한 번만 셔플
  const [shuffledKorean] = useState<string[]>(() =>
    [...pairs.map(p => p.korean)].sort(() => Math.random() - 0.5)
  )

  // 현재 선택된 왼쪽(영어) 단어
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)

  // 연결 맵: english → korean
  const [connections, setConnections] = useState<Record<string, string>>({})

  // 색상 맵: english → 색상 인덱스 (0~3)
  const [colorMap, setColorMap] = useState<Record<string, number>>({})

  // 제출 여부 / 정답 수
  const [submitted, setSubmitted] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)

  const englishWords = pairs.map(p => p.english)
  const correctMap = Object.fromEntries(pairs.map(p => [p.english, p.korean]))
  const totalConnected = Object.keys(connections).length
  const allConnected = totalConnected === 4

  // ─── 왼쪽(영어) 클릭 ─────────────────────────────────
  function handleLeftClick(english: string) {
    if (submitted) return
    // 이미 선택된 항목 클릭 → 선택 해제
    setSelectedLeft(prev => (prev === english ? null : english))
  }

  // ─── 오른쪽(한글) 클릭 ───────────────────────────────
  function handleRightClick(korean: string) {
    if (submitted || !selectedLeft) return

    setConnections(prev => {
      const next = { ...prev }
      // 이미 이 한글에 연결된 다른 영어가 있으면 제거
      for (const k of Object.keys(next)) {
        if (next[k] === korean && k !== selectedLeft) {
          delete next[k]
        }
      }
      next[selectedLeft] = korean
      return next
    })

    setColorMap(prev => {
      const next = { ...prev }
      // 이 한글의 이전 소유자 색상 제거
      for (const k of Object.keys(connections)) {
        if (connections[k] === korean && k !== selectedLeft) {
          delete next[k]
        }
      }
      // 이미 색상이 없으면 새로 할당
      if (next[selectedLeft] === undefined) {
        const used = new Set(Object.values(next))
        let idx = 0
        while (used.has(idx)) idx++
        next[selectedLeft] = idx
      }
      return next
    })

    setSelectedLeft(null)
  }

  // ─── 결과 확인 ────────────────────────────────────────
  function handleSubmit() {
    const correct = englishWords.filter(e => connections[e] === correctMap[e]).length
    setCorrectCount(correct)
    setSubmitted(true)
    onComplete(correct === 4)
  }

  // ─── 스타일 헬퍼 ──────────────────────────────────────
  function getLeftClass(english: string): string {
    const ci = colorMap[english]
    const isSelected = selectedLeft === english
    const isConnected = english in connections

    if (submitted) {
      if (!isConnected) return 'bg-secondary border-border text-muted-foreground'
      return connections[english] === correctMap[english]
        ? PAIR_COLORS[ci ?? 0].correct
        : PAIR_COLORS[ci ?? 0].wrong
    }
    if (isSelected) return 'bg-primary/15 border-primary text-primary shadow-sm scale-105'
    if (isConnected && ci !== undefined) return PAIR_COLORS[ci].base
    return 'bg-card border-border text-foreground hover:border-primary/50 hover:bg-primary/5'
  }

  function getRightClass(korean: string): string {
    const owner = Object.keys(connections).find(k => connections[k] === korean)
    const ci = owner !== undefined ? colorMap[owner] : undefined
    const isConnected = owner !== undefined
    const canClick = !submitted && selectedLeft !== null

    if (submitted) {
      if (!isConnected || owner === undefined) return 'bg-secondary border-border text-muted-foreground'
      return connections[owner] === correctMap[owner]
        ? PAIR_COLORS[ci ?? 0].correct
        : PAIR_COLORS[ci ?? 0].wrong
    }
    if (isConnected && ci !== undefined) return PAIR_COLORS[ci].base
    if (canClick) return 'bg-card border-dashed border-primary/50 text-foreground hover:border-primary hover:bg-primary/5 cursor-pointer'
    return 'bg-card border-border text-muted-foreground'
  }

  return (
    <div className="space-y-4">
      {/* 안내 문구 */}
      <p className="text-sm text-center text-muted-foreground">
        영단어를 클릭한 뒤, 알맞은 한국어 뜻을 클릭하여 연결하세요
      </p>

      {selectedLeft && !submitted && (
        <p className="text-xs text-center text-primary font-medium animate-pulse">
          「{selectedLeft}」 선택됨 — 오른쪽에서 뜻을 클릭하세요
        </p>
      )}

      {/* 두 열 레이아웃 */}
      <div className="grid grid-cols-2 gap-3">
        {/* 왼쪽: 영어 */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-center text-muted-foreground mb-1">영단어</p>
          {englishWords.map(english => (
            <button
              key={english}
              onClick={() => handleLeftClick(english)}
              disabled={submitted}
              className={cn(
                'w-full py-3 px-3 rounded-xl border-2 text-sm font-semibold transition-all text-center',
                getLeftClass(english)
              )}
            >
              {english}
              {/* 연결 표시 점 */}
              {connections[english] && !submitted && (
                <span className="ml-1 inline-block w-2 h-2 rounded-full bg-current opacity-60 align-middle" />
              )}
            </button>
          ))}
        </div>

        {/* 오른쪽: 한국어 (셔플됨) */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-center text-muted-foreground mb-1">한국어 뜻</p>
          {shuffledKorean.map(korean => (
            <button
              key={korean}
              onClick={() => handleRightClick(korean)}
              disabled={submitted || !selectedLeft}
              className={cn(
                'w-full py-3 px-3 rounded-xl border-2 text-sm font-semibold transition-all text-center',
                getRightClass(korean)
              )}
            >
              {korean}
            </button>
          ))}
        </div>
      </div>

      {/* 제출 후 오답 정답 표시 */}
      {submitted && correctCount < 4 && (
        <div className="bg-secondary/60 rounded-xl p-4 space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground">
            🔍 틀린 항목의 정답
          </p>
          {englishWords
            .filter(e => connections[e] !== correctMap[e])
            .map(english => (
              <p key={english} className="text-sm">
                <span className="font-bold text-foreground">{english}</span>
                <span className="text-muted-foreground"> → </span>
                <span className="font-bold text-foreground">{correctMap[english]}</span>
              </p>
            ))}
        </div>
      )}

      {/* 결과 확인 / 결과 배너 */}
      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={!allConnected}
          className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          결과 확인 ({totalConnected} / 4 연결됨)
        </button>
      ) : (
        <div
          className={cn(
            'flex items-center gap-3 p-4 rounded-xl border font-semibold',
            correctCount === 4
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-yellow-50 border-yellow-200 text-yellow-800'
          )}
        >
          {correctCount === 4
            ? <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            : <XCircle className="h-5 w-5 text-yellow-600 shrink-0" />
          }
          {correctCount === 4
            ? '완벽해요! 4개 모두 정답 🎉'
            : `${correctCount} / 4 정답`
          }
        </div>
      )}
    </div>
  )
}
