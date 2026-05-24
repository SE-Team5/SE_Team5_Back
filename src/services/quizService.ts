import { type Word } from './wordService'
import { requestJson } from './apiBase'

export type QuizType =
  | 'korean-to-english-choice'
  | 'korean-to-english-text'
  | 'english-to-korean-choice'
  | 'english-to-korean-text'
  | 'matching'

export type DateFilter = 'today' | 'week' | 'all'

export interface QuizQuestion {
  id: string
  type: QuizType
  word: Word
  options?: string[]        // 객관식 선택지
  correctAnswer: string
  matchingPairs?: Word[]    // matching 타입 전용: 4개의 단어 쌍
}

export interface QuizResult {
  totalQuestions: number
  correctAnswers: number
  answers: {
    questionId: string
    userAnswer: string
    isCorrect: boolean
    correctAnswer: string
  }[]
}

export interface GameRecord {
  id: number
  totalWords: number
  correctAnswers: number
  accuracyRate: number
  playedAt: string
}

export interface GameStatistics {
  totalGames: number
  totalWordsPlayed: number
  totalCorrect: number
  avgAccuracy: number
}

const API_BASE_URL = '/_/backend/api'

const nonMatchingTypes: Exclude<QuizType, 'matching'>[] = [
  'korean-to-english-choice',
  'korean-to-english-text',
  'english-to-korean-choice',
  'english-to-korean-text',
]

const allQuizTypes: QuizType[] = [...nonMatchingTypes, 'matching']

function getRandomQuizType(): QuizType {
  return allQuizTypes[Math.floor(Math.random() * allQuizTypes.length)]
}

function getRandomNonMatchingType(): Exclude<QuizType, 'matching'> {
  return nonMatchingTypes[Math.floor(Math.random() * nonMatchingTypes.length)]
}

function generateOptions(correctAnswer: string, allWords: Word[], isEnglish: boolean): string[] {
  const options = [correctAnswer]
  const otherAnswers = allWords
    .map(w => isEnglish ? w.english : w.korean)
    .filter(answer => answer !== correctAnswer)
  
  // Shuffle and pick 3 wrong answers
  const shuffled = otherAnswers.sort(() => Math.random() - 0.5)
  options.push(...shuffled.slice(0, 3))
  
  // Shuffle final options
  return options.sort(() => Math.random() - 0.5)
}

type BackendWord = {
  id?: string | number
  english?: string
  korean?: string
  example?: string | null
  term?: string
  definition?: string
  example_sentence?: string | null
}

type QuizStartResponse = {
  status?: string
  data?: {
    words?: BackendWord[]
    total?: number
  } | BackendWord[]
  words?: BackendWord[]
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  return requestJson<T>(API_BASE_URL, path, options)
}

function toWord(word: BackendWord): Word {
  return {
    id: String(word.id ?? ''),
    english: word.english ?? word.term ?? '',
    korean: word.korean ?? word.definition ?? '',
    example: word.example ?? word.example_sentence ?? undefined,
  }
}

function extractWords(response: QuizStartResponse): Word[] {
  const payload = Array.isArray(response.data)
    ? response.data
    : response.data?.words ?? response.words ?? []

  return payload.map(toWord).filter(word => word.english && word.korean)
}

export const quizService = {
  async generateQuiz(wordCount: number, userNo?: number, dateFilter: DateFilter = 'all'): Promise<QuizQuestion[]> {
    const params = new URLSearchParams()
    params.append('limit', String(wordCount))
    params.append('filter', dateFilter)
    if (userNo) {
      params.append('userNo', String(userNo))
    }

    const response = await request<QuizStartResponse>(`/quiz/start?${params.toString()}`)
    const words = extractWords(response)
    const allWords = words
    const questions: QuizQuestion[] = []
    let i = 0

    while (i < words.length) {
      const type = getRandomQuizType()

      // matching: 남은 단어가 4개 이상일 때만 생성
      if (type === 'matching' && words.length - i >= 4) {
        const matchingWords = words.slice(i, i + 4)
        questions.push({
          id: `q-matching-${i}-${Date.now()}`,
          type: 'matching',
          word: matchingWords[0],
          correctAnswer: '',
          matchingPairs: matchingWords,
        })
        i += 4
      } else {
        // matching이 뽑혔지만 단어 수 부족 → 일반 타입으로 대체
        const actualType = type === 'matching' ? getRandomNonMatchingType() : type
        const word = words[i]
        const isKoreanToEnglish = actualType.startsWith('korean-to-english')
        const correctAnswer = isKoreanToEnglish ? word.english : word.korean

        const question: QuizQuestion = {
          id: `q-${i}-${Date.now()}`,
          type: actualType,
          word,
          correctAnswer,
        }

        if (actualType.endsWith('choice')) {
          question.options = generateOptions(correctAnswer, allWords, isKoreanToEnglish)
        }

        questions.push(question)
        i++
      }
    }

    return questions
  },

  checkAnswer(question: QuizQuestion, userAnswer: string): boolean {
    const normalizedUserAnswer = userAnswer.trim().toLowerCase()
    const normalizedCorrectAnswer = question.correctAnswer.trim().toLowerCase()
    return normalizedUserAnswer === normalizedCorrectAnswer
  },

  async submitQuizResult(result: QuizResult, userNo: number): Promise<{ success: boolean }> {
    const response = await request<{ status?: string; success?: boolean }>(`/quiz/submit`, {
      method: 'POST',
      body: JSON.stringify({
        userNo,
        total: result.totalQuestions,
        correct: result.correctAnswers,
      }),
    })

    return { success: response.success ?? response.status === 'success' }
  },

  async getGameHistory(userNo: number, limit: number = 20): Promise<GameRecord[]> {
    const response = await request<{ status?: string; data?: GameRecord[] }>(`/quiz/history?userNo=${userNo}&limit=${limit}`)
    return (response.data ?? []).map(record => ({
      ...record,
      totalWords: Number(record.totalWords ?? 0),
      correctAnswers: Number(record.correctAnswers ?? 0),
      accuracyRate: Number(record.accuracyRate ?? 0),
    }))
  },

  async getGameStatistics(userNo: number): Promise<GameStatistics> {
    const response = await request<{ status?: string; data?: GameStatistics }>(`/quiz/statistics?userNo=${userNo}`)
    const data = response.data ?? {
      totalGames: 0,
      totalWordsPlayed: 0,
      totalCorrect: 0,
      avgAccuracy: 0
    }

    return {
      totalGames: Number(data.totalGames ?? 0),
      totalWordsPlayed: Number(data.totalWordsPlayed ?? 0),
      totalCorrect: Number(data.totalCorrect ?? 0),
      avgAccuracy: Number(data.avgAccuracy ?? 0),
    }
  }
}

