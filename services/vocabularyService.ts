import type { DetectedObject, VocabularyItem, Language } from '../types';

const VOCABULARY_KEY = 'ar-lang-learner-vocabulary';

/**
 * Retrieves the vocabulary from localStorage.
 * @returns {VocabularyItem[]} The stored vocabulary, or an empty array.
 */
export const getVocabulary = (): VocabularyItem[] => {
  try {
    const stored = localStorage.getItem(VOCABULARY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to parse vocabulary from localStorage:', error);
    return [];
  }
};

/**
 * Saves the vocabulary array to localStorage.
 * @param {VocabularyItem[]} vocabulary The vocabulary array to save.
 */
const saveVocabulary = (vocabulary: VocabularyItem[]): void => {
  try {
    localStorage.setItem(VOCABULARY_KEY, JSON.stringify(vocabulary));
  } catch (error)
 {
    console.error('Failed to save vocabulary to localStorage:', error);
  }
};

/**
 * Adds new words to the vocabulary from a list of detected objects.
 * Avoids adding duplicates for the same language.
 * @param {DetectedObject[]} newItems The new objects detected.
 * @param {Language} language The language of the translations.
 */
export const addVocabularyItems = (newItems: DetectedObject[], language: Language): void => {
  const currentVocabulary = getVocabulary();
  const existingWords = new Set(
    currentVocabulary.filter(item => item.language === language).map(item => item.word.toLowerCase())
  );

  const itemsToAdd: VocabularyItem[] = [];
  for (const item of newItems) {
    if (!existingWords.has(item.label.toLowerCase())) {
      itemsToAdd.push({
        word: item.label,
        translation: item.translation,
        language: language,
        added: Date.now(),
      });
      existingWords.add(item.label.toLowerCase()); // Prevent adding duplicates from the same batch
    }
  }
  
  if (itemsToAdd.length > 0) {
    const newVocabulary = [...itemsToAdd, ...currentVocabulary];
    saveVocabulary(newVocabulary);
  }
};

/**
 * Clears the entire vocabulary from localStorage.
 */
export const clearVocabulary = (): void => {
  try {
    localStorage.removeItem(VOCABULARY_KEY);
  } catch (error) {
    console.error('Failed to clear vocabulary from localStorage:', error);
  }
};
