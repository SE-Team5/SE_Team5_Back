export interface Word {
  id: number
  english: string
  korean: string
  example?: string
}

export interface DayWord {
  id: number
  word: Word
  exampleSentence?: string
  synonyms?: Word[]
  antonyms?: Word[]
  homonyms?: Word[]
}

export interface DayWordResponse {
  total: number
  page: number
  perPage: number
  pages: number
  items: DayWord[]
}

const API_BASE_URL = 'http://localhost:5000/api/day-wordbook'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const storedToken = typeof window !== 'undefined' ? sessionStorage.getItem('vocab_quiz_token') : null
  const headers = {
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
    ...(storedToken ? { Authorization: `Bearer ${storedToken}` } : {}),
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers,
    ...options,
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = typeof data?.message === 'string' ? data.message : 'Request failed'
    throw new Error(message)
  }

  return data as T
}

export const dayWordService = {
  /**
   * 오늘의 단어 목록 조회
   */
  async getDayWords(userId: number, page = 1, perPage = 20): Promise<DayWordResponse> {
    return request<DayWordResponse>(
      `?user_id=${userId}&page=${page}&per_page=${perPage}`
    )
  },

  /**
   * 단어 학습 완료 처리
   */
  async markWordLearned(dayWordId: number): Promise<{ status: string; message: string }> {
    return request(`/${dayWordId}/mark-learned`, {
      method: 'POST',
    })
  },
}
