export interface Word {
  id: string
  english: string
  korean: string
  example?: string
}

type BackendWord = {
  id?: string | number
  word_no?: string | number
  term?: string
  definition?: string
  example?: string | null
  example_sentence?: string | null
  word_english?: string
  word_korean?: string
}

type PaginatedWordResponse = {
  total?: number
  pages?: number
  items?: BackendWord[]
  words?: BackendWord[]
}

const API_BASE_URL = 'http://localhost:5000/api/wordbook'

function toWord(word: BackendWord): Word {
  return {
    id: String(word.id ?? word.word_no ?? ''),
    english: word.term ?? word.word_english ?? '',
    korean: word.definition ?? word.word_korean ?? '',
    example: word.example ?? word.example_sentence ?? undefined,
  }
}

function toBackendPayload(word: Omit<Word, 'id'>) {
  return {
    term: word.english,
    definition: word.korean,
    example: word.example || undefined,
  }
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

function parseCsvLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  values.push(current.trim())
  return values
}

function parseCsvWords(csvText: string): Array<Omit<Word, 'id'>> {
  const lines = csvText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)

  if (lines.length === 0) {
    return []
  }

  const firstRow = parseCsvLine(lines[0]).map(value => value.toLowerCase())
  const hasHeader = firstRow.some(value => ['english', 'korean', 'example', 'term', 'definition'].includes(value))

  const headerIndex = hasHeader
    ? {
        english: firstRow.findIndex(value => ['english', 'term', 'word', 'word_english'].includes(value)),
        korean: firstRow.findIndex(value => ['korean', 'definition', 'meaning', 'word_korean'].includes(value)),
        example: firstRow.findIndex(value => ['example', 'example_sentence'].includes(value)),
      }
    : { english: 0, korean: 1, example: 2 }

  const dataLines = hasHeader ? lines.slice(1) : lines

  return dataLines
    .map(line => parseCsvLine(line))
    .map(columns => ({
      english: columns[headerIndex.english] ?? '',
      korean: columns[headerIndex.korean] ?? '',
      example: columns[headerIndex.example] ?? '',
    }))
    .filter(word => word.english.trim() && word.korean.trim())
    .map(word => ({
      english: word.english.trim(),
      korean: word.korean.trim(),
      example: word.example?.trim() || undefined,
    }))
}

export const wordService = {
  async getWords(): Promise<Word[]> {
    const response = await request<PaginatedWordResponse>('?page=1&per_page=1000')
    const items = response.items ?? response.words ?? []
    return items.map(toWord)
  },

  async getWordsPaginated(page: number, limit: number = 10): Promise<{ words: Word[]; total: number }> {
    const response = await request<PaginatedWordResponse>(`?page=${page}&per_page=${limit}`)
    const items = response.items ?? response.words ?? []
    return {
      words: items.map(toWord),
      total: response.total ?? items.length,
    }
  },

  async addWord(word: Omit<Word, 'id'>): Promise<Word> {
    const response = await request<BackendWord>('', {
      method: 'POST',
      body: JSON.stringify(toBackendPayload(word)),
    })

    return toWord(response)
  },

  async updateWord(id: string, updates: Partial<Omit<Word, 'id'>>): Promise<Word | null> {
    const response = await request<BackendWord>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        term: updates.english,
        definition: updates.korean,
        example: updates.example,
      }),
    })

    return response ? toWord(response) : null
  },

  async deleteWord(id: string): Promise<boolean> {
    await request<{ message?: string }>(`/${id}`, {
      method: 'DELETE',
    })

    return true
  },

  async uploadCSV(file: File): Promise<{ success: boolean; count: number }> {
    const csvText = await file.text()
    const parsedWords = parseCsvWords(csvText)

    let successCount = 0
    for (const word of parsedWords) {
      await this.addWord(word)
      successCount += 1
    }

    return { success: true, count: successCount }
  },

  async getRandomWords(count: number): Promise<Word[]> {
    const words = await this.getWords()
    const shuffled = [...words].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, Math.min(count, shuffled.length))
  },
}
