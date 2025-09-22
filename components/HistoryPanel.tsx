import React from 'react';
import type { AnalysisHistoryItem } from '../types';
import { ResetIcon } from './Icons';

interface HistoryPanelProps {
  history: AnalysisHistoryItem[];
  onLoad: (id: string) => void;
  onClear: () => void;
  disabled: boolean;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onLoad, onClear, disabled }) => {
  return (
    <>
      {history.length > 0 ? (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
          {history.map((item) => (
            <button
              key={item.id}
              onClick={() => onLoad(item.id)}
              disabled={disabled}
              className="w-full text-left p-2 rounded-md bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-3"
            >
              <img src={item.image} alt="History thumbnail" className="w-12 h-12 object-cover rounded-md flex-shrink-0 bg-gray-800" />
              <div className="flex-grow overflow-hidden">
                <p className="text-sm font-medium text-gray-200 truncate">
                  {item.detectedObjects.length} object{item.detectedObjects.length !== 1 ? 's' : ''} found
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(item.timestamp).toLocaleString()}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-4">No history yet. Analyze an image to get started.</p>
      )}

      {history.length > 0 && (
        <button
          onClick={onClear}
          disabled={disabled}
          className="flex items-center justify-center w-full px-4 py-2 text-xs font-medium text-white bg-red-700 border border-transparent rounded-md shadow-sm hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 focus:ring-offset-gray-800 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors mt-4"
        >
          <ResetIcon className="w-4 h-4 mr-2" />
          Clear History
        </button>
      )}
    </>
  );
};