import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { DetectedObject } from '../types';
import { PreviousIcon, NextIcon, AudioIcon, CheckIcon, RedoIcon, ResetIcon, MicrophoneIcon } from './Icons';

interface ResultDisplayProps {
  image: string | null;
  detectedObjects: DetectedObject[];
  languageCode: string;
  onStartQuiz: () => void;
  onReset: () => void;
}

// Fix: Add type definitions for Web Speech API to resolve TypeScript errors.
// These definitions provide types for SpeechRecognition and related events which are not included by default.
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}
// Fix: Define the SpeechRecognitionEvent interface, which was missing and caused type errors for the onresult handler.
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
}

// Check for browser support for the Web Speech API
const isSpeechRecognitionSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

// Extend the Window interface for TypeScript
interface CustomWindow extends Window {
    SpeechRecognition: { new (): SpeechRecognition };
    webkitSpeechRecognition: { new (): SpeechRecognition };
}

type Feedback = {
  type: 'success' | 'error' | 'info';
  message: string;
  details?: React.ReactNode;
};

/**
 * Creates a character-level diff between two strings using an LCS-based algorithm.
 * @param text1 The "correct" text.
 * @param text2 The "user input" text.
 * @returns An array of diff objects.
 */
const createDiff = (text1: string, text2: string) => {
    const n = text1.length;
    const m = text2.length;
    const dp = Array(n + 1).fill(null).map(() => Array(m + 1).fill(0));
    for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
            if (text1[i - 1] === text2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    const diff = [];
    let i = n, j = m;
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && text1[i - 1] === text2[j - 1]) {
            diff.unshift({ type: 'correct', value: text1[i - 1] });
            i--; j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            diff.unshift({ type: 'added', value: text2[j - 1] });
            j--;
        } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
            diff.unshift({ type: 'removed', value: text1[i - 1] });
            i--;
        }
    }
    return diff;
};


const getPronunciationFeedback = (transcript: string, correctText: string): Feedback => {
  const normalizedTranscript = transcript.trim().toLowerCase();
  const normalizedCorrectText = correctText.trim().toLowerCase();

  if (normalizedTranscript === normalizedCorrectText) {
    return { type: 'success', message: 'Perfect!' };
  }
  
  const diff = createDiff(normalizedCorrectText, normalizedTranscript);
  let correctCharCount = 0;

  const details = (
    <div className="mt-2">
      <p className="text-sm text-gray-400">You said: <span className="italic">"{transcript}"</span></p>
      <p className="text-lg text-gray-300 font-mono tracking-wider p-2 bg-gray-900/50 rounded-md">
        {diff.map((part, index) => {
          if (part.type === 'correct') {
            correctCharCount += part.value.length;
            return <span key={index} className="text-green-400">{part.value}</span>;
          }
          if (part.type === 'removed') {
            return <span key={index} className="text-red-400 line-through bg-red-900/30">{part.value}</span>;
          }
          // We don't show 'added' parts in the 'correct answer' view, as they are extraneous.
          return null;
        })}
      </p>
    </div>
  );
  
  const accuracy = normalizedCorrectText.length > 0 ? (correctCharCount / normalizedCorrectText.length) * 100 : 0;
  let message = "Not quite. The red parts need practice.";
  if (accuracy > 85) {
      message = "So close! Pay attention to the details.";
  } else if (accuracy > 50) {
      message = "Good try! Let's work on the highlighted sections.";
  }

  return { type: 'error', message, details };
};

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ image, detectedObjects, languageCode, onStartQuiz, onReset }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imgRenderInfo, setImgRenderInfo] = useState({ width: 0, height: 0, offsetX: 0, offsetY: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const showSummary = currentIndex >= detectedObjects.length;

  // State for pronunciation practice feature
  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const calculateImageRenderInfo = useCallback(() => {
    if (imgRef.current && containerRef.current) {
        const img = imgRef.current;
        const container = containerRef.current;
        const { naturalWidth, naturalHeight } = img;
        const { width: containerWidth, height: containerHeight } = container.getBoundingClientRect();

        if (naturalWidth === 0 || naturalHeight === 0) return;

        const imgRatio = naturalWidth / naturalHeight;
        const containerRatio = containerWidth / containerHeight;

        let renderWidth = containerWidth;
        let renderHeight = containerHeight;
        
        if (imgRatio > containerRatio) { // Image is wider than container, so it's pillarboxed
            renderHeight = containerWidth / imgRatio;
        } else { // Image is taller than container, so it's letterboxed
            renderWidth = containerHeight * imgRatio;
        }

        const offsetX = (containerWidth - renderWidth) / 2;
        const offsetY = (containerHeight - renderHeight) / 2;

        setImgRenderInfo({
            width: renderWidth,
            height: renderHeight,
            offsetX,
            offsetY
        });
    }
  }, []);

  useEffect(() => {
    setCurrentIndex(0);
    setImgRenderInfo({ width: 0, height: 0, offsetX: 0, offsetY: 0 });
  }, [image]);

  useEffect(() => {
    // Recalculate on window resize
    const handleResize = () => calculateImageRenderInfo();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateImageRenderInfo]);

  // Effect to set up the SpeechRecognition instance once
  useEffect(() => {
    if (!isSpeechRecognitionSupported) {
      console.warn("Speech Recognition API not supported in this browser.");
      return;
    }
    const SpeechRecognition = (window as unknown as CustomWindow).SpeechRecognition || (window as unknown as CustomWindow).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      let errorMessage = 'An unknown error occurred.';
      if (event.error === 'no-speech') {
        errorMessage = 'No speech was detected. Please try again.';
      } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        errorMessage = 'Microphone access denied. Please enable it.';
      }
      setFeedback({ message: errorMessage, type: 'error' });
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Effect to update the result handler when the current object changes
  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      const correctTranslation = detectedObjects[currentIndex]?.translation;
      if (correctTranslation) {
        setFeedback(getPronunciationFeedback(transcript, correctTranslation));
      }
    };
  }, [currentIndex, detectedObjects]);

  // Effect to clear the feedback message after a delay
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const playAudio = useCallback(() => {
    if (showSummary || !detectedObjects[currentIndex]) return;
    const utterance = new SpeechSynthesisUtterance(detectedObjects[currentIndex].translation);
    utterance.lang = languageCode;
    speechSynthesis.speak(utterance);
  }, [currentIndex, detectedObjects, languageCode, showSummary]);

  useEffect(() => {
    if(!showSummary) {
      playAudio();
    }
  }, [playAudio, showSummary]);

  const handlePronunciationPractice = () => {
    const recognition = recognitionRef.current;
    if (isListening || !recognition) return;
    setFeedback(null);
    recognition.lang = languageCode;
    recognition.start();
  };

  if (!image) return null;
  if (detectedObjects.length === 0) {
    return <p className="text-gray-400">No objects found matching the criteria.</p>;
  }

  const currentObject = detectedObjects[currentIndex];

  const getBoundingBoxStyle = (box: DetectedObject['boundingBox']): React.CSSProperties => {
    if (!imgRenderInfo.width) return { display: 'none' };
    const left = box.topLeftX * imgRenderInfo.width + imgRenderInfo.offsetX;
    const top = box.topLeftY * imgRenderInfo.height + imgRenderInfo.offsetY;
    const width = (box.bottomRightX - box.topLeftX) * imgRenderInfo.width;
    const height = (box.bottomRightY - box.topLeftY) * imgRenderInfo.height;
    return { left, top, width, height };
  };

  const getTextLabelStyle = (box: DetectedObject['boundingBox']): React.CSSProperties => {
      if (!imgRenderInfo.width) return { display: 'none' };
      const topPx = box.topLeftY * imgRenderInfo.height + imgRenderInfo.offsetY;
      const leftPx = box.topLeftX * imgRenderInfo.width + imgRenderInfo.offsetX;
      const bottomPx = box.bottomRightY * imgRenderInfo.height + imgRenderInfo.offsetY;

      const labelTop = topPx - 32;
      return { 
          top: labelTop < 10 ? (bottomPx + 5) : labelTop,
          left: leftPx 
      };
  }

  const feedbackColors = {
    success: 'text-green-400',
    error: 'text-red-400',
    info: 'text-cyan-400',
  };

  return (
    <div className="w-full h-full flex flex-col">
      {showSummary ? (
        <div className="flex-grow flex flex-col items-center justify-center p-4">
            <CheckIcon className="w-16 h-16 text-green-400 mb-4"/>
            <h3 className="text-2xl font-bold mb-4 text-white">Lesson Complete!</h3>
            <p className="text-gray-400 mb-6">Here is your new vocabulary list. Ready to test your knowledge?</p>
            <ul className="bg-gray-900/50 rounded-lg p-6 w-full max-w-md space-y-3 text-left mb-8">
                {detectedObjects.map((obj, index) => (
                    <li key={index} className="flex justify-between items-center text-lg">
                        <span className="capitalize text-gray-300">{obj.label}</span>
                        <span className="font-semibold text-cyan-400">{obj.translation}</span>
                    </li>
                ))}
            </ul>

            <div className="flex items-center gap-4 mt-4">
                <button
                    onClick={onStartQuiz}
                    className="flex items-center justify-center px-6 py-3 text-lg font-semibold text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 border border-transparent rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-gray-800 transition-transform duration-150 ease-in-out hover:scale-105 active:scale-95"
                >
                    <RedoIcon className="w-6 h-6 mr-2" />
                    Start Quiz
                </button>
                <button
                    onClick={onReset}
                    className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gray-600 border border-transparent rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:ring-offset-gray-800 transition-colors"
                >
                    <ResetIcon className="w-5 h-5 mr-2" />
                    Start Over
                </button>
            </div>
        </div>
      ) : (
        <>
          <div ref={containerRef} className="relative w-full mb-4 flex-grow flex items-center justify-center overflow-hidden">
            <img
              ref={imgRef}
              src={image}
              alt="Analyzed"
              className="max-w-full max-h-full object-contain"
              onLoad={calculateImageRenderInfo}
            />
            {currentObject && imgRenderInfo.width > 0 && (
              <>
                <div
                  className="absolute border-4 border-cyan-400 rounded-md box-border transition-all duration-300 pointer-events-none shadow-lg shadow-cyan-400/50"
                  style={getBoundingBoxStyle(currentObject.boundingBox)}
                />
                <div 
                  className="absolute bg-black bg-opacity-70 text-white px-3 py-1 rounded-md text-sm whitespace-nowrap pointer-events-none"
                  style={getTextLabelStyle(currentObject.boundingBox)}
                >
                   {currentObject.label} → {currentObject.translation}
                </div>
              </>
            )}
          </div>
          <div className="flex-shrink-0 w-full">
            <p className="text-center text-gray-400 mb-2">
              Object {currentIndex + 1} of {detectedObjects.length} | Confidence: {currentObject && (currentObject.confidence * 100).toFixed(0)}%
            </p>
            <div className="flex items-center justify-center gap-2 md:gap-4">
              <button
                onClick={() => setCurrentIndex(i => i - 1)}
                disabled={currentIndex === 0}
                className="p-3 rounded-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out hover:scale-110 active:scale-100"
                aria-label="Previous object"
              >
                <PreviousIcon className="w-6 h-6" />
              </button>
              <button
                onClick={playAudio}
                className="p-4 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 transition-all duration-200 ease-in-out hover:scale-110 active:scale-100 shadow-lg"
                 aria-label="Play audio"
              >
                <AudioIcon className="w-8 h-8" />
              </button>
              {isSpeechRecognitionSupported && (
                <button
                  onClick={handlePronunciationPractice}
                  disabled={isListening}
                  className={`p-4 rounded-full transition-all duration-200 ease-in-out hover:scale-110 active:scale-100 shadow-lg ${isListening ? 'bg-red-500 animate-pulse scale-110' : 'bg-green-600 hover:bg-green-500'} disabled:opacity-50`}
                  aria-label="Practice pronunciation"
                >
                  <MicrophoneIcon className="w-8 h-8" />
                </button>
              )}
              <button
                onClick={() => setCurrentIndex(i => i + 1)}
                className="p-3 rounded-full bg-slate-700 hover:bg-slate-600 transition-all duration-200 ease-in-out hover:scale-110 active:scale-100"
                aria-label={currentIndex === detectedObjects.length - 1 ? "Finish and view summary" : "Next object"}
              >
                <NextIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="h-24 mt-2 flex items-center justify-center" aria-live="polite">
                {feedback && (
                    <div className="text-center">
                        <p className={`text-md font-semibold ${feedbackColors[feedback.type]}`}>
                            {feedback.message}
                        </p>
                        {feedback.details}
                    </div>
                )}
                {isListening && !feedback && (
                    <p className="text-cyan-400 animate-pulse">Listening...</p>
                )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};