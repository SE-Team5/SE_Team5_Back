// Word Service - Mock implementation
// Replace with actual API calls when connecting to Flask backend

export interface Word {
  id: string
  english: string
  korean: string
  example?: string
}

// Mock data - 30 words
const mockWords: Word[] = [
  { id: '1', english: 'apple', korean: '사과', example: 'I eat an apple every day.' },
  { id: '2', english: 'book', korean: '책', example: 'She is reading a book.' },
  { id: '3', english: 'computer', korean: '컴퓨터', example: 'The computer is very fast.' },
  { id: '4', english: 'dog', korean: '개', example: 'The dog is barking.' },
  { id: '5', english: 'elephant', korean: '코끼리', example: 'Elephants are large animals.' },
  { id: '6', english: 'flower', korean: '꽃', example: 'The flower smells nice.' },
  { id: '7', english: 'guitar', korean: '기타', example: 'He plays the guitar well.' },
  { id: '8', english: 'house', korean: '집', example: 'Our house is very big.' },
  { id: '9', english: 'island', korean: '섬', example: 'Jeju is a beautiful island.' },
  { id: '10', english: 'jacket', korean: '재킷', example: 'Wear your jacket, it is cold.' },
  { id: '11', english: 'kitchen', korean: '부엌', example: 'Mom is cooking in the kitchen.' },
  { id: '12', english: 'library', korean: '도서관', example: 'The library is quiet.' },
  { id: '13', english: 'mountain', korean: '산', example: 'We climbed the mountain.' },
  { id: '14', english: 'notebook', korean: '공책', example: 'Write it in your notebook.' },
  { id: '15', english: 'ocean', korean: '바다', example: 'The ocean is deep and blue.' },
  { id: '16', english: 'pencil', korean: '연필', example: 'I need a pencil to write.' },
  { id: '17', english: 'question', korean: '질문', example: 'Do you have any questions?' },
  { id: '18', english: 'restaurant', korean: '식당', example: 'Let us go to a restaurant.' },
  { id: '19', english: 'student', korean: '학생', example: 'The student is studying hard.' },
  { id: '20', english: 'teacher', korean: '선생님', example: 'The teacher is very kind.' },
  { id: '21', english: 'umbrella', korean: '우산', example: 'Bring an umbrella, it might rain.' },
  { id: '22', english: 'vacation', korean: '휴가', example: 'I went on vacation last week.' },
  { id: '23', english: 'window', korean: '창문', example: 'Open the window please.' },
  { id: '24', english: 'yesterday', korean: '어제', example: 'I met him yesterday.' },
  { id: '25', english: 'zero', korean: '영', example: 'The temperature is zero degrees.' },
  { id: '26', english: 'beautiful', korean: '아름다운', example: 'What a beautiful day!' },
  { id: '27', english: 'careful', korean: '조심하는', example: 'Be careful when crossing the street.' },
  { id: '28', english: 'difficult', korean: '어려운', example: 'This problem is difficult.' },
  { id: '29', english: 'exciting', korean: '신나는', example: 'The game was very exciting.' },
  { id: '30', english: 'friendly', korean: '친절한', example: 'She is very friendly.' }
]

let words = [...mockWords]

export const wordService = {
  async getWords(): Promise<Word[]> {
    await new Promise(resolve => setTimeout(resolve, 300))
    return [...words]
  },

  async getWordsPaginated(page: number, limit: number = 10): Promise<{ words: Word[]; total: number }> {
    await new Promise(resolve => setTimeout(resolve, 300))
    const start = (page - 1) * limit
    const end = start + limit
    return {
      words: words.slice(start, end),
      total: words.length
    }
  },

  async addWord(word: Omit<Word, 'id'>): Promise<Word> {
    await new Promise(resolve => setTimeout(resolve, 300))
    const newWord: Word = {
      id: `word-${Date.now()}`,
      ...word
    }
    words.push(newWord)
    return newWord
  },

  async updateWord(id: string, updates: Partial<Omit<Word, 'id'>>): Promise<Word | null> {
    await new Promise(resolve => setTimeout(resolve, 300))
    const index = words.findIndex(w => w.id === id)
    if (index === -1) return null
    
    words[index] = { ...words[index], ...updates }
    return words[index]
  },

  async deleteWord(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300))
    const index = words.findIndex(w => w.id === id)
    if (index === -1) return false
    
    words.splice(index, 1)
    return true
  },

  async uploadCSV(_file: File): Promise<{ success: boolean; count: number }> {
    // Mock CSV upload - in real app, this would parse and upload the file
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Simulate adding 5 words
    const newWords: Word[] = [
      { id: `csv-${Date.now()}-1`, english: 'example', korean: '예시', example: 'This is an example.' },
      { id: `csv-${Date.now()}-2`, english: 'practice', korean: '연습', example: 'Practice makes perfect.' },
      { id: `csv-${Date.now()}-3`, english: 'success', korean: '성공', example: 'Success requires effort.' },
      { id: `csv-${Date.now()}-4`, english: 'challenge', korean: '도전', example: 'Accept the challenge.' },
      { id: `csv-${Date.now()}-5`, english: 'progress', korean: '진전', example: 'You are making progress.' }
    ]
    words = [...words, ...newWords]
    
    return { success: true, count: 5 }
  },

  async getRandomWords(count: number): Promise<Word[]> {
    await new Promise(resolve => setTimeout(resolve, 300))
    const shuffled = [...words].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, Math.min(count, shuffled.length))
  }
}
