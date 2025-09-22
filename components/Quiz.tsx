import React, { useState, useMemo } from 'react';
import type { DetectedObject, QuizQuestion, Language } from '../types';
import { NextIcon, CheckIcon, XIcon } from './Icons';
import * as vocabularyService from '../services/vocabularyService';

interface QuizProps {
  objects: DetectedObject[];
  language: Language;
  onFinish: (score: number) => void;
}

const generateQuestions = (objects: DetectedObject[], language: Language): QuizQuestion[] => {
  if (objects.length === 0) return [];
  
  // Create a comprehensive pool of potential distractors from the user's vocabulary
  const currentTranslations = objects.map(o => o.translation);
  const vocabulary = vocabularyService.getVocabulary();
  const historicalTranslations = vocabulary
    .filter(item => item.language === language)
    .map(item => item.translation);
  
  // Use a Set to ensure all distractors in the pool are unique
  const distractorPool = Array.from(new Set([...currentTranslations, ...historicalTranslations]));

  const questions = objects.map(obj => {
    const correctAnswer = obj.translation;
    
    // Filter out the correct answer from the pool for this specific question
    let potentialDistractors = distractorPool.filter(t => t !== correctAnswer);

    // Shuffle the potential distractors
    for (let i = potentialDistractors.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [potentialDistractors[i], potentialDistractors[j]] = [potentialDistractors[j], potentialDistractors[i]];
    }

    // Always aim for 3 distractors to make 4 total choices
    const distractors = potentialDistractors.slice(0, 3);
    
    const choices = [correctAnswer, ...distractors];
    
    // Shuffle the final choices
    for (let i = choices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [choices[i], choices[j]] = [choices[j], choices[i]];
    }

    return {
      question: `What is the translation for "${obj.label}"?`,
      choices,
      correctAnswer,
      label: obj.label,
    };
  });

  // Shuffle the order of questions
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }

  return questions;
};


export const Quiz: React.FC<QuizProps> = ({ objects, language, onFinish }) => {
  const questions = useMemo(() => generateQuestions(objects, language), [objects, language]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleAnswer = (choice: string) => {
    if (selectedAnswer) return; // Prevent multiple answers

    setSelectedAnswer(choice);
    const correct = choice === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    if (correct) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (isTransitioning) return; // Prevent clicks during transition

    if (isLastQuestion) {
      onFinish(score);
    } else {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentQuestionIndex(i => i + 1);
        setSelectedAnswer(null);
        setIsCorrect(null);
        setIsTransitioning(false);
      }, 300); // Match fade-out duration
    }
  };

  const getButtonClass = (choice: string) => {
    if (!selectedAnswer) {
      return 'bg-gray-700 hover:bg-cyan-700';
    }
    if (choice === currentQuestion.correctAnswer) {
      return 'bg-green-600 border-green-400'; // Always show correct answer in green
    }
    if (choice === selectedAnswer) {
      return 'bg-red-600 border-red-400'; // Show selected incorrect answer in red
    }
    return 'bg-gray-700 opacity-50 border-transparent'; // Fade out other incorrect answers
  };
  
  if(!currentQuestion) return null;

  const progressPercentage = ((currentQuestionIndex) / questions.length) * 100;

  return (
    <div className="w-full h-full flex flex-col items-center justify-between p-4">
      <div className={`w-full max-w-lg text-center transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        {/* Progress Bar */}
        <div className="mb-4">
            <p className="text-gray-400 text-sm mb-2">Question {currentQuestionIndex + 1} of {questions.length} | Score: {score}</p>
            <div className="w-full bg-slate-700 rounded-full h-2.5">
                <div className="bg-gradient-to-r from-cyan-500 to-purple-600 h-2.5 rounded-full" style={{ width: `${progressPercentage}%`, transition: 'width 0.5s ease-in-out' }}></div>
            </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold mb-8 text-white">{currentQuestion.question}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentQuestion.choices.map((choice, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(choice)}
              disabled={!!selectedAnswer}
              className={`p-4 rounded-lg text-lg font-semibold text-white transition-all duration-300 transform hover:scale-105 disabled:cursor-not-allowed border-b-4 flex items-center justify-between ${getButtonClass(choice)}`}
            >
              <span className="flex-grow text-left">{choice}</span>
              {selectedAnswer && choice === currentQuestion.correctAnswer && <CheckIcon className="w-6 h-6 ml-2 flex-shrink-0" />}
              {selectedAnswer && choice !== currentQuestion.correctAnswer && choice === selectedAnswer && <XIcon className="w-6 h-6 ml-2 flex-shrink-0" />}
            </button>
          ))}
        </div>
      </div>
      
      {/* Feedback and Next Button Section */}
      <div className={`w-full max-w-lg mt-6 transition-opacity duration-300 ${selectedAnswer ? 'opacity-100' : 'opacity-0 invisible'}`}>
          {selectedAnswer && (
            <div className={`p-4 rounded-lg text-center ${isCorrect ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
                <p className={`text-xl font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`} aria-live="polite">
                    {isCorrect ? 'Correct!' : `Nice try! The correct answer is "${currentQuestion.correctAnswer}".`}
                </p>
                <button 
                    onClick={handleNext} 
                    className={`mt-4 w-full flex items-center justify-center px-6 py-3 text-lg font-medium text-white border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors ${isCorrect ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : 'bg-cyan-600 hover:bg-cyan-700 focus:ring-cyan-500'}`}
                >
                    {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
                    <NextIcon className="w-6 h-6 ml-2" />
                </button>
            </div>
        )}
      </div>
    </div>
  );
};