import React from 'react';
import type { AppConfig, Language } from '../types';

interface ConfigPanelProps {
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
  disabled: boolean;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, setConfig, disabled }) => {
  const languages: Language[] = ['Spanish', 'French', 'German', 'Italian'];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent border-b border-slate-700 pb-2">Configuration</h2>
      <div>
        <label htmlFor="language" className="block text-sm font-medium text-gray-300 mb-1">
          Target Language
        </label>
        <select
          id="language"
          value={config.language}
          onChange={(e) => setConfig({ ...config, language: e.target.value as Language })}
          disabled={disabled}
          className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {languages.map((lang) => (
            <option key={lang}>{lang}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="confidence" className="block text-sm font-medium text-gray-300 mb-1">
          Confidence Threshold: <span className="font-bold text-cyan-400">{Math.round(config.confidence * 100)}%</span>
        </label>
        <input
          id="confidence"
          type="range"
          min="0.2"
          max="0.9"
          step="0.05"
          value={config.confidence}
          onChange={(e) => setConfig({ ...config, confidence: parseFloat(e.target.value) })}
          disabled={disabled}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
};