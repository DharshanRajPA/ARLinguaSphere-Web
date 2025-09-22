import type { AnalysisHistoryItem, DetectedObject, AppConfig } from '../types';

const HISTORY_KEY = 'ar-lang-learner-history';
const MAX_HISTORY_ITEMS = 10;

/**
 * Retrieves the analysis history from localStorage.
 * @returns {AnalysisHistoryItem[]} The stored history, or an empty array if none exists.
 */
export const getHistory = (): AnalysisHistoryItem[] => {
  try {
    const storedHistory = localStorage.getItem(HISTORY_KEY);
    return storedHistory ? JSON.parse(storedHistory) : [];
  } catch (error) {
    console.error('Failed to parse history from localStorage:', error);
    return [];
  }
};

/**
 * Saves the entire history array to localStorage.
 * @param {AnalysisHistoryItem[]} history The history array to save.
 */
const saveHistory = (history: AnalysisHistoryItem[]): void => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save history to localStorage:', error);
  }
};

/**
 * Adds a new item to the history, ensuring the history doesn't exceed its max size.
 * @param {Omit<AnalysisHistoryItem, 'id' | 'timestamp'>} newItemData The data for the new history item.
 * @returns {AnalysisHistoryItem} The newly created and saved history item.
 */
export const addHistoryItem = (newItemData: Omit<AnalysisHistoryItem, 'id' | 'timestamp'>): AnalysisHistoryItem => {
  const currentHistory = getHistory();
  
  const newItem: AnalysisHistoryItem = {
    ...newItemData,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };

  // Add the new item to the beginning and slice to maintain the max length
  const newHistory = [newItem, ...currentHistory].slice(0, MAX_HISTORY_ITEMS);
  
  saveHistory(newHistory);
  return newItem;
};

/**
 * Clears the entire analysis history from localStorage.
 */
export const clearHistory = (): void => {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error('Failed to clear history from localStorage:', error);
  }
};
