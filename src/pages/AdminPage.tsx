import { useState, useEffect, useRef } from 'react'
import { wordService, type Word, type GeminiStatus } from '@/services/wordService'
import { toast } from 'sonner'
import { Settings, Plus, Pencil, Trash2, Upload, Loader2, X } from 'lucide-react'

type ModalMode = 'add' | 'edit' | null

export default function AdminPage() {
  const [words, setWords] = useState<Word[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCheckingGemini, setIsCheckingGemini] = useState(true)
  const [geminiStatus, setGeminiStatus] = useState<GeminiStatus | null>(null)
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [editingWord, setEditingWord] = useState<Word | null>(null)
  const [formData, setFormData] = useState({ english: '', korean: '', example: '' })
  const [isSaving, setIsSaving] = useState(false)
  const [deleteWordId, setDeleteWordId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isDraggingCsv, setIsDraggingCsv] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const didInitialLoadRef = useRef(false)

  useEffect(() => {
    if (didInitialLoadRef.current) {
      return
    }

    didInitialLoadRef.current = true
    loadWords()
    loadGeminiStatus()
  }, [])

  const loadWords = async () => {
    setIsLoading(true)
    try {
      const allWords = await wordService.getWords()
      setWords(allWords)
    } catch (error) {
      console.error('Failed to load words:', error)
      toast.error('단어를 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const loadGeminiStatus = async () => {
    setIsCheckingGemini(true)
    try {
      const status = await wordService.getGeminiStatus()
      setGeminiStatus(status)
    } catch (error) {
      console.error('Failed to load Gemini status:', error)
      setGeminiStatus(null)
    } finally {
      setIsCheckingGemini(false)
    }
  }

  const handleOpenAddModal = () => {
    setFormData({ english: '', korean: '', example: '' })
    setEditingWord(null)
    setModalMode('add')
  }

  const handleOpenEditModal = (word: Word) => {
    setFormData({
      english: word.english,
      korean: word.korean,
      example: word.example || ''
    })
    setEditingWord(word)
    setModalMode('edit')
  }

  const handleCloseModal = () => {
    setModalMode(null)
    setEditingWord(null)
    setFormData({ english: '', korean: '', example: '' })
  }

  const handleSaveWord = async () => {
    if (!formData.english.trim()) {
      toast.error('영단어를 입력해주세요.')
      return
    }
    if (!formData.korean.trim()) {
      toast.error('한국어 뜻을 입력해주세요.')
      return
    }

    setIsSaving(true)
    try {
      if (modalMode === 'add') {
        await wordService.addWord({
          english: formData.english.trim(),
          korean: formData.korean.trim(),
          example: formData.example.trim() || undefined
        })
        toast.success('단어가 추가되었습니다.')
      } else if (modalMode === 'edit' && editingWord) {
        await wordService.updateWord(editingWord.id, {
          english: formData.english.trim(),
          korean: formData.korean.trim(),
          example: formData.example.trim() || undefined
        })
        toast.success('단어가 수정되었습니다.')
      }
      handleCloseModal()
      loadWords()
    } catch (error) {
      console.error('Failed to save word:', error)
      toast.error('저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteWord = async () => {
    if (!deleteWordId) return

    setIsDeleting(true)
    try {
      await wordService.deleteWord(deleteWordId)
      toast.success('단어가 삭제되었습니다.')
      setDeleteWordId(null)
      loadWords()
    } catch (error) {
      console.error('Failed to delete word:', error)
      toast.error('삭제에 실패했습니다.')
    } finally {
      setIsDeleting(false)
    }
  }

  const uploadCsvFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('CSV 파일만 업로드할 수 있습니다.')
      return
    }

    setIsUploading(true)
    try {
      const result: any = await wordService.uploadCSV(file)
      if (result.success) {
        toast.success(`${result.count}개 단어가 추가되었습니다.`)
        loadWords()
      } else if (result.count > 0) {
        toast.success(`${result.count}개 단어가 추가되었습니다. 일부 항목은 실패했습니다.`)
        console.warn('CSV upload partial failures:', result.failures)
        loadWords()
      } else {
        toast.error('CSV 업로드에 실패했습니다. 상세 정보는 콘솔을 확인하세요.')
        console.error('CSV upload failures:', result.failures)
      }
    } catch (error) {
      console.error('Failed to upload CSV:', error)
      toast.error('CSV 업로드에 실패했습니다.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    await uploadCsvFile(file)
  }

  const handleCSVDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDraggingCsv(false)

    const file = event.dataTransfer.files?.[0]
    if (!file) return

    await uploadCsvFile(file)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">관리자 페이지</h1>
              <p className="text-muted-foreground">총 {words.length}개의 단어</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <div
              onDragOver={(event) => {
                event.preventDefault()
                setIsDraggingCsv(true)
              }}
              onDragEnter={(event) => {
                event.preventDefault()
                setIsDraggingCsv(true)
              }}
              onDragLeave={(event) => {
                event.preventDefault()
                setIsDraggingCsv(false)
              }}
              onDrop={handleCSVDrop}
              className={`min-w-[240px] rounded-xl border-2 border-dashed px-4 py-3 transition-colors ${
                isDraggingCsv
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-secondary/20 hover:border-primary/50 hover:bg-secondary/40'
              }`}
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                <span>CSV를 드래그하거나 클릭해서 업로드</span>
              </button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                .csv 파일만 가능
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="hidden"
              />
            </div>
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">단어 추가</span>
            </button>
          </div>
        </div>

        <div
          className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
            isCheckingGemini
              ? 'border-border bg-secondary/40 text-muted-foreground'
              : geminiStatus?.valid
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : geminiStatus?.configured
                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                  : 'border-border bg-secondary/40 text-muted-foreground'
          }`}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              AI를 통한 예문 자동생성은 유효한 API 키가 있을 때만 동작하고, 키가 없거나 잘못되면 기본 예문으로 채워집니다.
            </div>
            <div className="shrink-0 text-xs font-medium">
              {isCheckingGemini
                ? 'API 키 상태 확인 중...'
                : geminiStatus?.valid
                  ? 'API 키 유효'
                  : geminiStatus?.configured
                    ? 'API 키 확인 필요'
                    : 'API 키 미설정'}
            </div>
          </div>
          {!isCheckingGemini && geminiStatus?.message ? (
            <div className="mt-1 text-xs opacity-90">{geminiStatus.message}</div>
          ) : null}
        </div>

        {/* Word List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            {/* Table Header */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-4 bg-secondary/50 border-b border-border">
              <div className="col-span-3 text-sm font-medium text-muted-foreground">영단어</div>
              <div className="col-span-3 text-sm font-medium text-muted-foreground">한국어 뜻</div>
              <div className="col-span-4 text-sm font-medium text-muted-foreground">예문</div>
              <div className="col-span-2 text-sm font-medium text-muted-foreground text-right">관리</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
              {words.map((word) => (
                <div
                  key={word.id}
                  className="px-6 py-4 hover:bg-secondary/30 transition-colors"
                >
                  {/* Desktop View */}
                  <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
                    <div className="col-span-3 font-medium text-foreground">{word.english}</div>
                    <div className="col-span-3 text-foreground">{word.korean}</div>
                    <div className="col-span-4 text-muted-foreground text-sm truncate">
                      {word.example || '-'}
                    </div>
                    <div className="col-span-2 flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenEditModal(word)}
                        className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteWordId(word.id)}
                        className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Mobile View */}
                  <div className="md:hidden space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-3">
                        <span className="text-lg font-bold text-primary">{word.english}</span>
                        <span className="text-foreground">{word.korean}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenEditModal(word)}
                          className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteWordId(word.id)}
                          className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalMode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-md shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">
                {modalMode === 'add' ? '단어 추가' : '단어 수정'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="english" className="block text-sm font-medium text-foreground mb-2">
                  영단어 <span className="text-destructive">*</span>
                </label>
                <input
                  id="english"
                  type="text"
                  value={formData.english}
                  onChange={(e) => setFormData(prev => ({ ...prev, english: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="영단어를 입력하세요"
                />
              </div>

              <div>
                <label htmlFor="korean" className="block text-sm font-medium text-foreground mb-2">
                  한국어 뜻 <span className="text-destructive">*</span>
                </label>
                <input
                  id="korean"
                  type="text"
                  value={formData.korean}
                  onChange={(e) => setFormData(prev => ({ ...prev, korean: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="한국어 뜻을 입력하세요"
                />
              </div>

              <div>
                <label htmlFor="example" className="block text-sm font-medium text-foreground mb-2">
                  예문 <span className="text-muted-foreground">(선택)</span>
                </label>
                <p className="mb-2 text-xs text-muted-foreground">
                  비워두면 자동 생성됩니다. AI 예문은 유효한 API 키가 있을 때만 사용됩니다.
                </p>
                <textarea
                  id="example"
                  rows={4}
                  value={formData.example}
                  onChange={(e) => setFormData(prev => ({ ...prev, example: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="예문을 입력하세요"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCloseModal}
                className="flex-1 py-3 rounded-lg border border-border text-foreground font-medium hover:bg-secondary transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSaveWord}
                disabled={isSaving}
                className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  modalMode === 'add' ? '추가' : '저장'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteWordId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-sm shadow-lg">
            <h2 className="text-lg font-bold text-foreground mb-2">단어 삭제</h2>
            <p className="text-muted-foreground mb-6">
              이 단어를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteWordId(null)}
                className="flex-1 py-3 rounded-lg border border-border text-foreground font-medium hover:bg-secondary transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDeleteWord}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-lg bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  '삭제'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
