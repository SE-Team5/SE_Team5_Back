import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { petService, getPetImage, getPetStageName } from '@/services/petService'

/** 화면 우하단에 배경처럼 고정되는 식물 펫 */
export default function MiniPet() {
  const { user } = useAuth()
  const [petLevel, setPetLevel] = useState<number>(1)
  const [loaded, setLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    const userNo = Number(user.id)
    if (!userNo) return

    petService.getPetStatus(userNo)
      .then(s => setPetLevel(s.pet_level))
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [user?.id])

  /** 이미지 로드 실패 시 이모지 표시 */
  const fallbackEmoji = petLevel >= 7 ? '🌸' : petLevel >= 4 ? '🌿' : '🌱'

  return (
    <Link
      to="/pet"
      className="fixed bottom-0 right-6 sm:right-10 z-30 group select-none"
      aria-label={`내 식물 펫 보기 (${getPetStageName(petLevel)} 단계 Lv.${petLevel})`}
    >
      {/* ── 호버 툴팁 ─────────────────────────────────── */}
      <div
        className="
          absolute -top-11 left-1/2 -translate-x-1/2
          bg-foreground/90 text-background
          text-xs font-semibold
          px-3 py-1.5 rounded-full shadow-lg
          whitespace-nowrap pointer-events-none
          opacity-0 group-hover:opacity-100
          transition-opacity duration-200
        "
      >
        🌱 LIVO · {getPetStageName(petLevel)} 단계
        <span className="ml-1 text-primary-foreground/70">Lv.{petLevel}</span>
      </div>

      {/* ── 식물 영역 ─────────────────────────────────── */}
      <div className="relative flex flex-col items-center">

        {/* 레벨 뱃지 */}
        <div
          className="
            absolute -top-2 -right-2 z-10
            w-6 h-6 sm:w-7 sm:h-7
            bg-primary text-primary-foreground
            text-[10px] sm:text-xs font-bold
            rounded-full shadow-md ring-2 ring-background
            flex items-center justify-center
            transition-transform duration-300 group-hover:scale-110
          "
        >
          {petLevel}
        </div>

        {/* 식물 이미지 */}
        <div className="h-28 sm:h-36 md:h-44 w-auto flex items-end justify-center">
          {!imgError ? (
            <img
              src={getPetImage(petLevel)}
              alt={`LIVO 식물 - ${getPetStageName(petLevel)}`}
              className="
                h-full w-auto object-contain
                pet-sway
                drop-shadow-xl
                transition-transform duration-300
                group-hover:scale-110
              "
              style={loaded ? undefined : { opacity: 0 }}
              onLoad={() => setLoaded(true)}
              onError={() => { setImgError(true); setLoaded(true) }}
            />
          ) : (
            /* 이미지 없을 때 이모지 폴백 */
            <span
              className="
                text-6xl sm:text-7xl md:text-8xl leading-none
                pet-sway drop-shadow-lg
                transition-transform duration-300
                group-hover:scale-110
              "
            >
              {fallbackEmoji}
            </span>
          )}
        </div>

        {/* 바닥 그림자 — 식물이 땅에 서 있는 느낌 */}
        <div className="w-12 sm:w-16 h-2 bg-black/10 dark:bg-white/10 rounded-full blur-sm -mt-1" />
      </div>
    </Link>
  )
}
