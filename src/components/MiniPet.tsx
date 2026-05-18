import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { petService, getPetImage, getPetStageName } from '@/services/petService'

export default function MiniPet() {
  const { user } = useAuth()
  const [petLevel, setPetLevel] = useState<number>(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    
    const loadPetStatus = async () => {
      setLoading(true)
      try {
        const userNo = Number(user.id)
        if (!userNo) return
        
        const status = await petService.getPetStatus(userNo)
        setPetLevel(status.pet_level)
      } catch (error) {
        console.error('Failed to load mini pet status:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPetStatus()
  }, [user?.id])

  if (loading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-4 shadow-sm animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-secondary" />
          <div className="flex-1">
            <div className="h-4 bg-secondary rounded w-20 mb-2" />
            <div className="h-3 bg-secondary rounded w-16" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <Link
      to="/pet"
      className="group block bg-card rounded-2xl border border-border p-4 shadow-sm hover:border-primary/50 hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-4">
        {/* Mini Pet Image */}
        <div className="relative">
          <div className="w-16 h-16 rounded-xl bg-secondary/50 flex items-center justify-center overflow-hidden group-hover:bg-secondary/70 transition-colors">
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
                  fallback.className = 'fallback-text text-2xl'
                  fallback.textContent = petLevel >= 7 ? '🌸' : petLevel >= 4 ? '🌱' : '🌿'
                  parent.appendChild(fallback)
                }
              }}
            />
          </div>
          {/* Level Badge */}
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
            {petLevel}
          </div>
        </div>

        {/* Pet Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground">LIVO</h3>
          <p className="text-sm text-muted-foreground truncate">
            {getPetStageName(petLevel)} 단계 (Lv. {petLevel})
          </p>
        </div>

        {/* Arrow */}
        <div className="text-muted-foreground group-hover:text-primary transition-colors">
          <span className="text-sm font-medium">&rarr;</span>
        </div>
      </div>
    </Link>
  )
}
