
export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  category: string;
  difficulty: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  description: string;
  content: string; // The full text of the book/chapter
  duration: number; // in minutes
  progress: number; // 0 to 100
}

export interface Category {
  id: string;
  name: string;
  imageUrl: string;
}

export interface WordAnalysis {
  word: string;
  translation: string;
  partOfSpeech: string;
  gender?: string; // der/die/das
  contextMeaning: string;
  exampleSentence: string;
  grammaticalNote?: string; // For Word-Lab section
}

export interface Brief {
  level: 'A1' | 'A2' | 'B1' | 'B2';
  genre: string;
  wordCount: number;
}

export interface DraftChapter {
  id: string;
  title: string;
  content: string;
  status: 'pending' | 'generating' | 'done';
}

export interface DraftBook {
  title: string;
  brief: Brief;
  outline: string[];
  chapters: DraftChapter[];
  coverUrl: string;
  description: string;
  slug: string;
}

export type ViewState = 'HOME' | 'READER' | 'PROFILE' | 'STUDIO';
