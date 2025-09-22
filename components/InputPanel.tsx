import React, { useRef } from 'react';
import { CameraIcon, UploadIcon, ResetIcon } from './Icons';

interface InputPanelProps {
  onUpload: (file: File) => void;
  onWebcamClick: () => void;
  onReset: () => void;
  disabled: boolean;
  hasResult: boolean;
}

export const InputPanel: React.FC<InputPanelProps> = ({ onUpload, onWebcamClick, onReset, disabled, hasResult }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent border-b border-slate-700 pb-2">Input Image</h2>
      <div className="flex flex-col space-y-3">
        <button
          onClick={onWebcamClick}
          disabled={disabled}
          className="flex items-center justify-center w-full px-4 py-3 text-base font-semibold text-white bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 border border-transparent rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 ease-in-out hover:scale-105 active:scale-95"
        >
          <CameraIcon className="w-5 h-5 mr-2" />
          Use Webcam
        </button>
        <div className="flex items-center">
          <hr className="flex-grow border-gray-600"/>
          <span className="mx-2 text-gray-500 text-xs">OR</span>
          <hr className="flex-grow border-gray-600"/>
        </div>
        <button
          onClick={handleUploadClick}
          disabled={disabled}
          className="flex items-center justify-center w-full px-4 py-3 text-base font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border border-transparent rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 ease-in-out hover:scale-105 active:scale-95"
        >
          <UploadIcon className="w-5 h-5 mr-2" />
          Upload Image
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
        />
        {hasResult && (
           <button
             onClick={onReset}
             disabled={disabled}
             className="flex items-center justify-center w-full px-4 py-2 text-sm font-semibold text-white bg-red-600 border border-transparent rounded-lg shadow-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-gray-800 disabled:bg-gray-500 disabled:cursor-not-allowed transition-transform duration-150 ease-in-out hover:scale-105 active:scale-95"
           >
             <ResetIcon className="w-5 h-5 mr-2" />
             Start Over
           </button>
        )}
      </div>
    </div>
  );
};