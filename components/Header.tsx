import React from 'react';
import { ARIcon } from './Icons';

export const Header: React.FC = () => {
  return (
    <header className="bg-slate-900/70 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10">
      <div className="container mx-auto px-4 md:px-8 py-4 flex flex-col items-center justify-center gap-2">
        <ARIcon className="w-12 h-12 text-cyan-400" />
        <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">AR Language Learner</h1>
            <p className="text-sm text-gray-400">AI-Powered Object Recognition and Translation</p>
        </div>
      </div>
    </header>
  );
};