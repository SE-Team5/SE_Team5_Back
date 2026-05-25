import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface PetCheerProps {
  message: string
  onClose: () => void
}

export default function PetCheer({ message, onClose }: PetCheerProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger enter animation
    const enterTimer = setTimeout(() => {
      setIsVisible(true)
    }, 10)

    // Auto close after 3 seconds
    const closeTimer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Wait for exit animation
    }, 3000)

    return () => {
      clearTimeout(enterTimer)
      clearTimeout(closeTimer)
    }
  }, [onClose])

  return (
    <div
      className={cn(
        'fixed bottom-20 right-4 z-40 transition-all duration-300 ease-out',
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4'
      )}
    >
      {/* Speech Bubble */}
      <div className="relative bg-card border border-border rounded-2xl shadow-lg p-4 max-w-[200px]">
        {/* Message */}
        <p className="text-sm font-medium text-foreground text-center">
          {message}
        </p>
        
        {/* Bubble Tail */}
        <div className="absolute -bottom-2 right-6 w-4 h-4 bg-card border-r border-b border-border transform rotate-45" />
      </div>

      {/* Mini Pet Icon */}
      <div className="flex justify-end mt-1 mr-2">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shadow-md">
          <span className="text-2xl">🌱</span>
        </div>
      </div>
    </div>
  )
}
