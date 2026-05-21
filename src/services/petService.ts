// Pet Service - Flask backend integration with mock fallback

import { getApiBaseUrl } from './apiBase'

const API_BASE_URL = getApiBaseUrl('/_/backend/api')

// Fallback cheer messages
const FALLBACK_CHEER_MESSAGES = [
  "조금만 더 화이팅!",
  "잘 하고 있어!",
  "오늘도 열심히!",
  "거의 다 왔어!",
  "최고야!"
]

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const storedToken = typeof window !== 'undefined' ? sessionStorage.getItem('vocab_quiz_token') : null
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(storedToken ? { Authorization: `Bearer ${storedToken}` } : {}),
      ...(options?.headers || {})
    },
    ...options,
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok && !data) {
    throw new Error('Request failed')
  }

  return data as T
}

export interface PetStatusResponse {
  pet_level: number
  pet_last_updated: string | null
}

export interface PetUpdateResponse {
  pet_level: number
}

export interface CheerMessageResponse {
  message: string
}

// 백엔드 응답 구조: { status, data: { ... } }
interface BackendPetStatusResponse {
  status: string
  data?: {
    pet_level: number
    pet_last_updated: string | null
  }
  message?: string
}

interface BackendPetUpdateResponse {
  status: string
  data?: {
    pet_level: number
  }
  message?: string
}

interface BackendCheerResponse {
  status: string
  data?: {
    message: string
  }
  message?: string
}

// Helper function to get pet image based on level
export function getPetImage(level: number): string {
  if (level >= 7) {
    return '/images/pet_stage3.png' // 개화 단계 (7~10)
  } else if (level >= 4) {
    return '/images/pet_stage2.png' // 성장 단계 (4~6)
  } else {
    return '/images/pet_stage1.png' // 새싹 단계 (1~3)
  }
}

// Helper function to get pet stage name
export function getPetStageName(level: number): string {
  if (level >= 7) {
    return '개화'
  } else if (level >= 4) {
    return '성장'
  } else {
    return '새싹'
  }
}

// Helper function to get pet status message
export function getPetStatusMessage(level: number): string {
  if (level >= 7) {
    return '활짝 피었어요!'
  } else if (level >= 4) {
    return '무럭무럭 자라고 있어요'
  } else {
    return '이제 막 자라기 시작했어요'
  }
}

export const petService = {
  // Get pet status (level and last updated)
  async getPetStatus(userNo: number): Promise<PetStatusResponse> {
    try {
      const response = await request<BackendPetStatusResponse>(`/pet/status?userNo=${encodeURIComponent(userNo)}`)
      // 백엔드 응답: { status: 'success', data: { pet_level, pet_last_updated } }
      if (response.status === 'success' && response.data) {
        return {
          pet_level: response.data.pet_level ?? 1,
          pet_last_updated: response.data.pet_last_updated ?? null
        }
      }
      throw new Error(response.message || 'Failed to get pet status')
    } catch {
      // Mock fallback
      return {
        pet_level: 1,
        pet_last_updated: null
      }
    }
  },

  // Update pet level based on quiz completion
  async updatePetLevel(userNo: number, isStudied: boolean): Promise<PetUpdateResponse> {
    try {
      const response = await request<BackendPetUpdateResponse>('/pet/update', {
        method: 'POST',
        body: JSON.stringify({ userNo, isStudied })
      })
      // 백엔드 응답: { status: 'success', data: { pet_level } }
      if (response.status === 'success' && response.data) {
        return {
          pet_level: response.data.pet_level ?? 1
        }
      }
      throw new Error(response.message || 'Failed to update pet level')
    } catch {
      // Mock fallback
      return {
        pet_level: isStudied ? 2 : 1
      }
    }
  },

  // Get cheer message from GAI
  async getCheerMessage(): Promise<CheerMessageResponse> {
    try {
      const response = await request<BackendCheerResponse>('/pet/cheer')
      // 백엔드 응답: { status: 'success', data: { message } }
      if (response.status === 'success' && response.data) {
        return {
          message: response.data.message ?? FALLBACK_CHEER_MESSAGES[0]
        }
      }
      throw new Error('Failed to get cheer message')
    } catch {
      // Mock fallback
      const randomIndex = Math.floor(Math.random() * FALLBACK_CHEER_MESSAGES.length)
      return {
        message: FALLBACK_CHEER_MESSAGES[randomIndex]
      }
    }
  },

  // Get random fallback cheer message (for QuizPage inline use)
  getRandomCheerMessage(): string {
    const randomIndex = Math.floor(Math.random() * FALLBACK_CHEER_MESSAGES.length)
    return FALLBACK_CHEER_MESSAGES[randomIndex]
  }
}
