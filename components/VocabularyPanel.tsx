import React from 'react';
import type { VocabularyItem } from '../types';
import { ResetIcon } from './Icons';

interface VocabularyPanelProps {
  vocabulary: VocabularyItem[];
  onClear: () => void;
  disabled: boolean;
}

export const VocabularyPanel: React.FC<VocabularyPanelProps> = ({ vocabulary, onClear, disabled }) => {
  const sortedVocabulary = [...vocabulary].sort((a, b) => b.added - a.added);

  return (
    <>
      {sortedVocabulary.length > 0 ? (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
          {sortedVocabulary.map((item, index) => (
            <div key={`${item.word}-${index}`} className="w-full text-left p-2 rounded-md bg-slate-700 flex justify-between items-center">
              <span className="capitalize text-sm font-medium text-gray-200">{item.word}</span>
              <span className="text-sm text-cyan-400">{item.translation}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-4">Your vocabulary is empty. Found objects will be saved here.</p>
      )}

      {sortedVocabulary.length > 0 && (
        <button
          onClick={onClear}
          disabled={disabled}
          className="flex items-center justify-center w-full px-4 py-2 text-xs font-medium text-white bg-red-700 border border-transparent rounded-md shadow-sm hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 focus:ring-offset-gray-800 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors mt-4"
        >
          <ResetIcon className="w-4 h-4 mr-2" />
          Clear Vocabulary
        </button>
      )}
    </>
  );
};