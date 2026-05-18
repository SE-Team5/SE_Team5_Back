import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { petService, getPetImage, getPetStatusMessage, getPetStageName } from '@/services/petService'
import { Loader2, Sparkles, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export default function PetPage() {
  const { user } = useAuth()
  const [petLevel, setPetLevel] = useState<number>(1)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [cheerMessage, setCheerMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [cheerLoading, setCheerLoading] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    
    const loadPetStatus = async () => {
      setLoading(true)
      try {
        const userNo = Number(user.id)
        if (!userNo) return
        
        const status = await petService.getPetStatus(userNo)
        setPetLevel(status.pet_level)
        setLastUpdated(status.pet_last_updated)
      } catch (error) {
        console.error('Failed to load pet status:', error)
        toast.error('펫 상태를 불러오는데 실패했습니다')
      } finally {
        setLoading(false)
      }
    }

    loadPetStatus()
  }, [user?.id])

  const handleGetCheerMessage = async () => {
    setCheerLoading(true)
    try {
      const response = await petService.getCheerMessage()
      setCheerMessage(response.message)
    } catch (error) {
      console.error('Failed to get cheer message:', error)
      toast.error('응원 메시지를 불러오는데 실패했습니다')
    } finally {
      setCheerLoading(false)
    }
  }

  const formatLastUpdated = (dateString: string | null) => {
    if (!dateString) return '아직 기록이 없어요'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return '알 수 없음'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">펫 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  const progressPercentage = (petLevel / 10) * 100

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">마이 펫</h1>
          <p className="text-muted-foreground">LIVO와 함께 성장해요</p>
        </div>

        {/* Pet Card */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm mb-6">
          {/* Pet Image */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-48 h-48 rounded-2xl bg-secondary/50 flex items-center justify-center overflow-hidden">
                <img
                  src={getPetImage(petLevel)}
                  alt={`LIVO - ${getPetStageName(petLevel)} 단계`}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent && !parent.querySelector('.fallback-text')) {
                      const fallback = document.createElement('div')
                      fallback.className = 'fallback-text text-6xl'
                      fallback.textContent = petLevel >= 7 ? '🌸' : petLevel >= 4 ? '🌱' : '🌿'
                      parent.appendChild(fallback)
                    }
                  }}
                />
              </div>
              {/* Stage Badge */}
              <div className="absolute -top-2 -right-2 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                {getPetStageName(petLevel)}
              </div>
            </div>
          </div>

          {/* Pet Name */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">LIVO</h2>
            <p className="text-muted-foreground text-sm mt-1">
              {getPetStatusMessage(petLevel)}
            </p>
          </div>

          {/* Level Gauge */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">레벨</span>
              <span className="text-sm font-bold text-primary">Lv. {petLevel} / 10</span>
            </div>
            <div className="h-4 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>새싹 (1-3)</span>
              <span>성장 (4-6)</span>
              <span>개화 (7-10)</span>
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-center text-sm text-muted-foreground mb-6">
            <p>마지막 업데이트: {formatLastUpdated(lastUpdated)}</p>
          </div>

          {/* Cheer Button */}
          <button
            onClick={handleGetCheerMessage}
            disabled={cheerLoading}
            className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {cheerLoading ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                불러오는 중...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                응원 메시지 받기
              </>
            )}
          </button>

          {/* Cheer Message Display */}
          {cheerMessage && (
            <div className="mt-4 p-4 bg-primary/10 rounded-xl border border-primary/20">
              <p className="text-center text-foreground font-medium">
                "{cheerMessage}"
              </p>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h3 className="font-bold text-foreground mb-4">펫 성장 안내</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>매일 퀴즈를 완료하면 펫 레벨이 1 올라가요 (최대 10)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>퀴즈를 완료하지 않으면 레벨이 1 내려가요 (최소 1)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>꾸준히 학습해서 LIVO를 활짝 피워보세요!</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
