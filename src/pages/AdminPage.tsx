import { useState, useEffect, useRef } from 'react'
import { wordService, type Word } from '@/services/wordService'
import { toast } from 'sonner'
import { Settings, Plus, Pencil, Trash2, Upload, Loader2, X } from 'lucide-react'

type ModalMode = 'add' | 'edit' | null

export default function AdminPage() {
  const [words, setWords] = useState<Word[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [editingWord, setEditingWord] = useState<Word | null>(null)
  const [formData, setFormData] = useState({ english: '', korean: '', example: '' })
  const [isSaving, setIsSaving] = useState(false)
  const [deleteWordId, setDeleteWordId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadWords()
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

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const result = await wordService.uploadCSV(file)
      if (result.success) {
        toast.success(`${result.count}개 단어가 추가되었습니다.`)
        loadWords()
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
          <div className="flex gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">CSV 업로드</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="hidden"
            />
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">단어 추가</span>
            </button>
          </div>
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
                <input
                  id="example"
                  type="text"
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
