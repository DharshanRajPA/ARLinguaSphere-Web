import React from 'react';

export const Spinner: React.FC = () => {
  return (
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-purple-500 border-t-cyan-400 mx-auto mb-4"></div>
      <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">Analyzing Image...</h3>
      <p className="text-gray-400">The AI is identifying objects and translating them.</p>
    </div>
  );
};