import { type Word } from './wordService'

export type QuizType = 
  | 'korean-to-english-choice'
  | 'korean-to-english-text'
  | 'english-to-korean-choice'
  | 'english-to-korean-text'

export interface QuizQuestion {
  id: string
  type: QuizType
  word: Word
  options?: string[] // For multiple choice questions
  correctAnswer: string
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

const API_BASE_URL = 'http://localhost:5000/api/quiz'

const quizTypes: QuizType[] = [
  'korean-to-english-choice',
  'korean-to-english-text',
  'english-to-korean-choice',
  'english-to-korean-text'
]

function getRandomQuizType(): QuizType {
  return quizTypes[Math.floor(Math.random() * quizTypes.length)]
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
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = typeof data?.message === 'string' ? data.message : 'Request failed'
    throw new Error(message)
  }

  return data as T
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
  async generateQuiz(wordCount: number): Promise<QuizQuestion[]> {
    const response = await request<QuizStartResponse>(`/start?limit=${wordCount}`)
    const words = extractWords(response)
    const allWords = words

    return words.map((word, index) => {
      const type = getRandomQuizType()
      const isKoreanToEnglish = type.startsWith('korean-to-english')
      const isChoiceType = type.endsWith('choice')
      
      const correctAnswer = isKoreanToEnglish ? word.english : word.korean
      
      const question: QuizQuestion = {
        id: `q-${index}-${Date.now()}`,
        type,
        word,
        correctAnswer
      }
      
      if (isChoiceType) {
        question.options = generateOptions(correctAnswer, allWords, isKoreanToEnglish)
      }
      
      return question
    })
  },

  checkAnswer(question: QuizQuestion, userAnswer: string): boolean {
    const normalizedUserAnswer = userAnswer.trim().toLowerCase()
    const normalizedCorrectAnswer = question.correctAnswer.trim().toLowerCase()
    return normalizedUserAnswer === normalizedCorrectAnswer
  },

  async submitQuizResult(result: QuizResult, userNo: number): Promise<{ success: boolean }> {
    const response = await request<{ status?: string; success?: boolean }>(`/submit`, {
      method: 'POST',
      body: JSON.stringify({
        userNo,
        total: result.totalQuestions,
        correct: result.correctAnswers,
      }),
    })

    return { success: response.success ?? response.status === 'success' }
  }
}
