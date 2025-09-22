export interface DetectedObject {
  label: string;
  translation: string;
  confidence: number;
  boundingBox: {
    topLeftX: number;
    topLeftY: number;
    bottomRightX: number;
    bottomRightY: number;
  };
}

export type Language = 'Spanish' | 'French' | 'German' | 'Italian';

export enum LanguageCode {
  Spanish = 'es',
  French = 'fr',
  German = 'de',
  Italian = 'it',
}

export interface AppConfig {
  language: Language;
  confidence: number;
}

export interface QuizQuestion {
  question: string;
  choices: string[];
  correctAnswer: string;
  label: string;
}

export interface AnalysisHistoryItem {
    id: string;
    timestamp: number;
    image: string;
    detectedObjects: DetectedObject[];
    config: AppConfig;
}

export interface VocabularyItem {
  word: string; // The english label
  translation: string;
  language: Language;
  added: number; // timestamp
}