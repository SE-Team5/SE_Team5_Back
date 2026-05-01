// Quiz Service - Mock implementation
// Replace with actual API calls when connecting to Flask backend

import { wordService, type Word } from './wordService'

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

export const quizService = {
  async generateQuiz(wordCount: number): Promise<QuizQuestion[]> {
    const words = await wordService.getRandomWords(wordCount)
    const allWords = await wordService.getWords()
    
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

  async submitQuizResult(result: QuizResult): Promise<{ success: boolean }> {
    // Mock submission - in real app, this would save to backend
    await new Promise(resolve => setTimeout(resolve, 300))
    return { success: true }
  }
}
