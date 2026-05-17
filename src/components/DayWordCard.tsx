import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { DayWord } from '@/services/dayWordService'
import { cn } from '@/lib/utils'

interface DayWordCardProps {
  dayWord: DayWord
  isExpanded: boolean
  onToggle: () => void
}

export default function DayWordCard({
  dayWord,
  isExpanded,
  onToggle,
}: DayWordCardProps) {
  const { word, exampleSentence, synonyms = [], antonyms = [], homonyms = [] } = dayWord

  // Defensive fallbacks: some API responses map word fields at top-level
  const english = word?.english ?? (dayWord as any).term ?? ''
  const korean = word?.korean ?? (dayWord as any).definition ?? ''

  return (
    <div className="mb-3">
      {/* Word Block */}
      <button
        onClick={onToggle}
        className={cn(
          'w-full rounded-lg border-2 transition-all duration-200',
          'hover:border-primary/50 hover:shadow-md',
          'focus:outline-none focus:ring-2 focus:ring-primary/50',
          isExpanded ? 'border-primary bg-primary/5' : 'border-border bg-card'
        )}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex-1 text-left">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">한국어</p>
                <p className="text-lg font-bold text-foreground">{korean}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">영단어</p>
                <p className="text-lg font-bold text-primary">{english}</p>
              </div>
            </div>
          </div>
          <ChevronDown
            className={cn(
              'h-5 w-5 text-muted-foreground transition-transform duration-200',
              isExpanded && 'transform rotate-180'
            )}
          />
        </div>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-2 rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-4">
          {/* Example Sentence */}
          {exampleSentence && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">예문</p>
              <p className="text-sm text-foreground italic">"{exampleSentence}"</p>
            </div>
          )}

          {/* Synonyms */}
          {synonyms.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">유의어</p>
              <div className="flex flex-wrap gap-2">
                {synonyms.map((syn) => (
                  <div
                    key={syn.id}
                    className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm"
                  >
                    {syn.english}
                    <span className="text-xs text-blue-600 ml-1">({syn.korean})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Antonyms */}
          {antonyms.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">반의어</p>
              <div className="flex flex-wrap gap-2">
                {antonyms.map((ant) => (
                  <div
                    key={ant.id}
                    className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm"
                  >
                    {ant.english}
                    <span className="text-xs text-red-600 ml-1">({ant.korean})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Homonyms */}
          {homonyms.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">동의어</p>
              <div className="flex flex-wrap gap-2">
                {homonyms.map((homo) => (
                  <div
                    key={homo.id}
                    className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm"
                  >
                    {homo.english}
                    <span className="text-xs text-purple-600 ml-1">({homo.korean})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
