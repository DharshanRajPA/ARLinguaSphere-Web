import React from 'react';
import { CheckIcon, RedoIcon, ResetIcon } from './Icons';

interface QuizResultsProps {
  score: number;
  total: number;
  onRestart: () => void;
  onStartOver: () => void;
}

export const QuizResults: React.FC<QuizResultsProps> = ({ score, total, onRestart, onStartOver }) => {
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  const getFeedback = () => {
    if (percentage === 100) return "Perfect! You're a language master!";
    if (percentage >= 75) return "Great job! You're learning fast!";
    if (percentage >= 50) return "Good effort! Keep practicing!";
    return "You're just getting started! Don't give up!";
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center p-4 text-center">
      <CheckIcon className="w-16 h-16 text-green-400 mb-4" />
      <h3 className="text-2xl font-bold mb-2 text-white">Quiz Complete!</h3>
      <p className="text-gray-400 mb-6">{getFeedback()}</p>

      <div className="bg-slate-800/50 rounded-lg p-6 w-full max-w-xs space-y-3 mb-8">
        <p className="text-lg text-gray-300">Your Score</p>
        <p className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
          {score} <span className="text-3xl text-gray-400">/ {total}</span>
        </p>
        <p className="text-xl font-semibold text-purple-400">({percentage}%)</p>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onRestart}
          className="flex items-center justify-center px-6 py-3 text-lg font-semibold text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 border border-transparent rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-gray-800 transition-transform duration-150 ease-in-out hover:scale-105 active:scale-95"
        >
          <RedoIcon className="w-6 h-6 mr-2" />
          Try Again
        </button>
        <button
          onClick={onStartOver}
          className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gray-600 border border-transparent rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:ring-offset-gray-800 transition-colors"
        >
          <ResetIcon className="w-5 h-5 mr-2" />
          Start Over
        </button>
      </div>
    </div>
  );
};