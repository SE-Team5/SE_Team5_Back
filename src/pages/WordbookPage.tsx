import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { wordService, type Word, type WordRelation, type WordbookFilter, type WordbookSearchField, type WordbookSort } from '@/services/wordService'
import { ArrowUpDown, Book, ChevronDown, ChevronLeft, ChevronRight, Loader2, Search, Star, Sparkles } from 'lucide-react'

const ITEMS_PER_PAGE = 10

const FILTER_LABELS: Record<WordbookFilter, string> = {
  all: '전체 단어',
  unmemorized: '공부하지 않은 단어들만',
  favorite: '즐겨찾기한 단어만',
}

const SORT_OPTIONS: Array<{ value: WordbookSort; label: string }> = [
  { value: 'term_asc', label: '알파벳 순' },
  { value: 'created_at_desc', label: '웹 앱에 추가된 순' },
]

const SEARCH_FIELD_OPTIONS: Array<{ value: WordbookSearchField; label: string }> = [
  { value: 'english', label: '영단어' },
  { value: 'korean', label: '한국어' },
]

export default function WordbookPage() {
  const { user } = useAuth()
  const userId = user?.id
  const [words, setWords] = useState<Word[]>([])
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const [totalWords, setTotalWords] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchText, setSearchText] = useState('')
  const [appliedSearchText, setAppliedSearchText] = useState('')
  const [searchField, setSearchField] = useState<WordbookSearchField>('english')
  const [selectedFilter, setSelectedFilter] = useState<WordbookFilter>('all')
  const [selectedSort, setSelectedSort] = useState<WordbookSort>('created_at_desc')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [updatingWordId, setUpdatingWordId] = useState<string | null>(null)

  const totalPages = Math.ceil(totalWords / ITEMS_PER_PAGE)

  useEffect(() => {
    loadWords()
  }, [currentPage, appliedSearchText, searchField, selectedFilter, selectedSort, userId])

  const loadWords = async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      if ((selectedFilter === 'favorite' || selectedFilter === 'unmemorized') && !userId) {
        setWords([])
        setTotalWords(0)
        setErrorMessage('즐겨찾기와 학습 상태 필터는 로그인 후 사용할 수 있습니다.')
        return
      }

      const result = await wordService.getWordsPaginated(currentPage, ITEMS_PER_PAGE, {
        filter: selectedFilter,
        sort: selectedSort,
        keyword: appliedSearchText.trim() || undefined,
        searchField,
        userId,
      })
      setWords(result.words)
      setTotalWords(result.total)
    } catch (error) {
      console.error('Failed to load words:', error)
      setWords([])
      setTotalWords(0)
      setErrorMessage('단어장을 불러오지 못했습니다. 서버 연결을 확인해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (filter: WordbookFilter) => {
    setCurrentPage(1)
    setSelectedFilter(filter)
  }

  const handleSortChange = (sort: WordbookSort) => {
    setCurrentPage(1)
    setSelectedSort(sort)
  }

  const handleSearch = () => {
    setCurrentPage(1)
    setAppliedSearchText(searchText.trim())
  }

  const handleSearchFieldChange = (field: WordbookSearchField) => {
    setCurrentPage(1)
    setSearchField(field)
  }

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => (
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    ))
  }

  const handleToggleFavorite = async (word: Word) => {
    if (!userId) {
      toast.error('로그인 후 즐겨찾기를 사용할 수 있습니다.')
      return
    }

    setUpdatingWordId(word.id)
    try {
      await wordService.updateWordStatus(word.id, {
        userId,
        isBookmarked: !word.isFavorite,
        isMemorized: word.isMemorized,
      })
      await loadWords()
      toast.success(word.isFavorite ? '즐겨찾기에서 제거했습니다.' : '즐겨찾기에 추가했습니다.')
    } catch (error) {
      console.error('Failed to update favorite status:', error)
      toast.error('즐겨찾기 변경에 실패했습니다.')
    } finally {
      setUpdatingWordId(null)
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

  const emptyTitle =
    appliedSearchText
      ? '검색 결과가 없습니다.'
      : selectedFilter === 'favorite'
        ? '즐겨찾기한 단어가 없습니다.'
        : selectedFilter === 'unmemorized'
          ? '공부하지 않은 단어가 없습니다.'
          : '등록된 단어가 없습니다.'

  const emptyDescription =
    appliedSearchText
      ? '검색 기준과 단어를 다시 확인해보세요.'
      : selectedFilter === 'favorite'
        ? '카드 우측 별을 눌러 즐겨찾기를 추가해보세요.'
        : selectedFilter === 'unmemorized'
          ? '모든 단어를 이미 학습 완료했거나 필터 조건에 맞는 단어가 없습니다.'
          : '관리자 페이지에서 단어를 추가해주세요.'

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-10">
        <div className="mb-8 rounded-3xl border border-border bg-card/80 p-6 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Book className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  전체 단어장
                </div>
                <p className="mt-2 text-muted-foreground">
                  총 {totalWords}개의 단어를 보고 있습니다
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 md:min-w-[360px]">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  정렬
                </label>
                <div className="relative">
                  <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <select
                    value={selectedSort}
                    onChange={(event) => handleSortChange(event.target.value as WordbookSort)}
                    className="w-full rounded-xl border border-border bg-background px-10 py-3 text-sm font-medium text-foreground outline-none transition-colors focus:border-primary"
                  >
                    {SORT_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  필터
                </label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(FILTER_LABELS) as WordbookFilter[]).map(filter => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => handleFilterChange(filter)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        selectedFilter === filter
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {FILTER_LABELS[filter]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  검색
                </label>
                <div className="grid gap-3 sm:grid-cols-[120px_1fr_auto]">
                  <select
                    value={searchField}
                    onChange={(event) => handleSearchFieldChange(event.target.value as WordbookSearchField)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm font-medium text-foreground outline-none transition-colors focus:border-primary"
                  >
                    {SEARCH_FIELD_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchText}
                      onChange={(event) => setSearchText(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          handleSearch()
                        }
                      }}
                      placeholder={searchField === 'english' ? '영단어를 검색하세요' : '한국어 뜻을 검색하세요'}
                      className="w-full rounded-xl border border-border bg-background px-10 py-3 text-sm font-medium text-foreground outline-none transition-colors focus:border-primary"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSearch}
                    className="rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    검색
                  </button>
                </div>
                {appliedSearchText && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-secondary px-3 py-1 font-medium text-secondary-foreground">
                      {SEARCH_FIELD_OPTIONS.find(option => option.value === searchField)?.label}
                    </span>
                    <span>“{appliedSearchText}” 검색 중</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchText('')
                        setAppliedSearchText('')
                        setCurrentPage(1)
                      }}
                      className="font-medium text-primary hover:underline"
                    >
                      검색 초기화
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Word List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : errorMessage ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center shadow-sm">
            <p className="text-foreground font-medium mb-2">{errorMessage}</p>
            <p className="text-sm text-muted-foreground">잠시 후 다시 시도해보세요.</p>
          </div>
        ) : words.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center shadow-sm">
            <p className="text-foreground font-medium mb-2">{emptyTitle}</p>
            <p className="text-sm text-muted-foreground">{emptyDescription}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4">
              {words.map(word => {
                const expanded = expandedIds.includes(word.id)

                return (
                <div
                  key={word.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleExpanded(word.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      toggleExpanded(word.id)
                    }
                  }}
                  className="relative w-full text-left bg-card rounded-2xl border border-border p-5 shadow-sm hover:border-primary/40 hover:shadow-md transition-all cursor-pointer"
                >
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      void handleToggleFavorite(word)
                    }}
                    disabled={updatingWordId === word.id}
                    aria-label={word.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                    className={`absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                      word.isFavorite
                        ? 'border-amber-300 bg-amber-100 text-amber-500 hover:bg-amber-200'
                        : 'border-border bg-background text-muted-foreground hover:border-amber-300 hover:text-amber-500'
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {updatingWordId === word.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Star className={`h-4 w-4 ${word.isFavorite ? 'fill-current' : ''}`} />
                    )}
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center pr-12">
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
                        <RelationBlock label="유의어/동의어" items={word.relations?.synonym ?? []} />
                        <RelationBlock label="반의어" items={word.relations?.antonym ?? []} />
                      </div>
                    </div>
                  )}
                </div>
                )
              })}
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
