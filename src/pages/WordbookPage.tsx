import { useState, useEffect } from 'react'
import { wordService, type Word } from '@/services/wordService'
import { Book, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

const ITEMS_PER_PAGE = 10

export default function WordbookPage() {
  const [words, setWords] = useState<Word[]>([])
  const [totalWords, setTotalWords] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  const totalPages = Math.ceil(totalWords / ITEMS_PER_PAGE)

  useEffect(() => {
    loadWords()
  }, [currentPage])

  const loadWords = async () => {
    setIsLoading(true)
    try {
      const result = await wordService.getWordsPaginated(currentPage, ITEMS_PER_PAGE)
      setWords(result.words)
      setTotalWords(result.total)
    } catch (error) {
      console.error('Failed to load words:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Book className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">단어장</h1>
            <p className="text-muted-foreground">총 {totalWords}개의 단어</p>
          </div>
        </div>

        {/* Word List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              {/* Table Header */}
              <div className="hidden md:grid md:grid-cols-3 gap-4 px-6 py-4 bg-secondary/50 border-b border-border">
                <div className="text-sm font-medium text-muted-foreground">영단어</div>
                <div className="text-sm font-medium text-muted-foreground">한국어 뜻</div>
                <div className="text-sm font-medium text-muted-foreground">예문</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-border">
                {words.map((word) => (
                  <div
                    key={word.id}
                    className="px-6 py-4 hover:bg-secondary/30 transition-colors"
                  >
                    {/* Desktop View */}
                    <div className="hidden md:grid md:grid-cols-3 gap-4">
                      <div className="font-medium text-foreground">{word.english}</div>
                      <div className="text-foreground">{word.korean}</div>
                      <div className="text-muted-foreground text-sm">
                        {word.example || '-'}
                      </div>
                    </div>
                    
                    {/* Mobile View */}
                    <div className="md:hidden space-y-2">
                      <div className="flex items-baseline gap-3">
                        <span className="text-lg font-bold text-primary">{word.english}</span>
                        <span className="text-foreground">{word.korean}</span>
                      </div>
                      {word.example && (
                        <p className="text-sm text-muted-foreground italic">
                          {'"'}{word.example}{'"'}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                이전
              </button>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {currentPage} / {totalPages} 페이지
                </span>
              </div>

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
