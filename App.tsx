import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { ConfigPanel } from './components/ConfigPanel';
import { InputPanel } from './components/InputPanel';
import { ResultDisplay } from './components/ResultDisplay';
import { WebcamCapture } from './components/WebcamCapture';
import { Spinner } from './components/Spinner';
import { Quiz } from './components/Quiz';
import { QuizResults } from './components/QuizResults';
import { HistoryPanel } from './components/HistoryPanel';
import { VocabularyPanel } from './components/VocabularyPanel';
import { detectObjects } from './services/geminiService';
import * as historyService from './services/historyService';
import * as vocabularyService from './services/vocabularyService';
import type { DetectedObject, Language, AppConfig, AnalysisHistoryItem, VocabularyItem } from './types';
import { LanguageCode } from './types';
import { BookIcon, HistoryIcon, StartIcon, ARIcon } from './components/Icons';

const ApiKeyInstructions: React.FC = () => (
    <div className="fixed inset-0 bg-gray-950 z-50 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-2xl text-center shadow-2xl">
            <ARIcon className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mb-4">
                Configuration Needed
            </h2>
            <p className="text-gray-300 text-lg mb-2">
                Welcome to the AR Language Learner!
            </p>
            <p className="text-gray-400 mb-6">
                To get started, you need to set up your Google Gemini API key. The application cannot connect to the AI service without it.
            </p>
            <div className="bg-gray-900 p-4 rounded-lg text-left">
                <p className="text-gray-300 font-semibold">Please follow the instructions in the <code className="bg-slate-700 text-cyan-400 px-2 py-1 rounded">README.md</code> file to create a <code className="bg-slate-700 text-cyan-400 px-2 py-1 rounded">.env.local</code> file and add your API key.</p>
            </div>
            <p className="text-sm text-gray-500 mt-6">
                Once the key is added, please restart the development server.
            </p>
        </div>
    </div>
);


const App: React.FC = () => {
  const [config, setConfig] = useState<AppConfig>({
    language: 'Spanish',
    confidence: 0.45,
  });
  const [image, setImage] = useState<string | null>(null);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showWebcam, setShowWebcam] = useState<boolean>(false);
  const [quizState, setQuizState] = useState<'inactive' | 'active' | 'finished'>('inactive');
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [activeTab, setActiveTab] = useState<'vocabulary' | 'history'>('vocabulary');
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);

  useEffect(() => {
    // Check if the API key is missing. The key is injected by the build tool (e.g., Vite)
    if (!process.env.API_KEY || process.env.API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
        setIsApiKeyMissing(true);
    }
    setHistory(historyService.getHistory());
    setVocabulary(vocabularyService.getVocabulary());
  }, []);

  const addToHistory = (item: Omit<AnalysisHistoryItem, 'id' | 'timestamp'>) => {
    const newItem = historyService.addHistoryItem(item);
    setHistory(prev => [newItem, ...prev]);
  };

  const addVocabulary = (objects: DetectedObject[], language: Language) => {
    vocabularyService.addVocabularyItems(objects, language);
    setVocabulary(vocabularyService.getVocabulary());
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your entire analysis history? This action cannot be undone.')) {
      historyService.clearHistory();
      setHistory([]);
    }
  };

  const handleClearVocabulary = () => {
    if (window.confirm('Are you sure you want to clear your entire vocabulary list? This action cannot be undone.')) {
        vocabularyService.clearVocabulary();
        setVocabulary([]);
    }
  };

  const loadFromHistory = useCallback((id: string) => {
    const item = history.find(h => h.id === id);
    if (item) {
      resetState();
      setTimeout(() => {
        setImage(item.image);
        setDetectedObjects(item.detectedObjects);
        setConfig(item.config);
        setError(null);
        setIsLoading(false);
        setQuizState('inactive');
      }, 50); // Small delay to ensure state reset completes
    }
  }, [history]);

  const handleAnalysis = useCallback(async (imageDataUrl: string) => {
    if (isApiKeyMissing) {
        setError("API Key is not configured. Please see the instructions.");
        return;
    }
    setIsLoading(true);
    setError(null);
    setDetectedObjects([]);
    setImage(imageDataUrl);

    try {
      const langCode = LanguageCode[config.language as Language];
      const result = await detectObjects(imageDataUrl, langCode);

      if (result && result.length > 0) {
        // First, filter by confidence
        const confidentObjects = result.filter(obj => obj.confidence >= config.confidence);
        
        // Then, de-duplicate, keeping the one with the highest confidence
        const uniqueObjectsMap = new Map<string, DetectedObject>();
        for (const obj of confidentObjects) {
            const existing = uniqueObjectsMap.get(obj.label);
            if (!existing || obj.confidence > existing.confidence) {
                uniqueObjectsMap.set(obj.label, obj);
            }
        }
        const uniqueObjects = Array.from(uniqueObjectsMap.values());

        if(uniqueObjects.length === 0) {
            setError(`No objects found with confidence above ${Math.round(config.confidence * 100)}%. Try lowering the threshold.`);
        } else {
            setDetectedObjects(uniqueObjects);
            addToHistory({ image: imageDataUrl, detectedObjects: uniqueObjects, config });
            addVocabulary(uniqueObjects, config.language);
        }
      } else {
        setError('No objects were detected in the image. Please try another one.');
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred. Please check the console.');
    } finally {
      setIsLoading(false);
    }
  }, [config, isApiKeyMissing]);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        handleAnalysis(e.target.result);
      }
    };
    reader.onerror = () => {
        setError("Failed to read the uploaded file.");
    }
    reader.readAsDataURL(file);
  };
  
  const handleWebcamCapture = (imageDataUrl: string) => {
    setShowWebcam(false);
    handleAnalysis(imageDataUrl);
  };

  const resetState = useCallback(() => {
    setImage(null);
    setDetectedObjects([]);
    setError(null);
    setIsLoading(false);
    setQuizState('inactive');
    setScore(0);
  }, []);

  const handleStartQuiz = useCallback(() => {
    setQuizState('active');
  }, []);

  const handleFinishQuiz = useCallback((finalScore: number) => {
    setScore(finalScore);
    setQuizState('finished');
  }, []);
  
  if (isApiKeyMissing) {
    return <ApiKeyInstructions />;
  }

  const renderContent = () => {
    if (isLoading) return <Spinner />;
    if (error) {
      return (
        <div className="text-center text-red-400">
          <h3 className="text-xl font-bold mb-2">An Error Occurred</h3>
          <p>{error}</p>
        </div>
      );
    }
    if (quizState === 'active') {
      return <Quiz objects={detectedObjects} language={config.language} onFinish={handleFinishQuiz} />;
    }
    if (quizState === 'finished') {
      return (
        <QuizResults
          score={score}
          total={detectedObjects.length}
          onRestart={handleStartQuiz}
          onStartOver={resetState}
        />
      );
    }
    if (image) {
      return (
        <ResultDisplay
          image={image}
          detectedObjects={detectedObjects}
          languageCode={LanguageCode[config.language as Language]}
          onStartQuiz={handleStartQuiz}
          onReset={resetState}
        />
      );
    }
    return (
      <div className="text-center text-gray-500 flex flex-col items-center justify-center">
        <StartIcon className="w-24 h-24 text-gray-700 mb-4" />
        <h3 className="text-2xl font-semibold mb-2 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">Get Started</h3>
        <p>Upload an image or use your webcam to begin.</p>
      </div>
    );
  };
  
  const tabButtonClasses = "w-full text-center p-3 font-semibold transition-colors duration-200 flex items-center justify-center gap-2";
  const activeTabClasses = "text-cyan-400 border-b-2 border-cyan-400";
  const inactiveTabClasses = "text-gray-400 hover:text-white";

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-3">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-3xl p-6 space-y-6 sticky top-8 shadow-2xl">
              <ConfigPanel config={config} setConfig={setConfig} disabled={isLoading || quizState !== 'inactive'} />
              <InputPanel
                onUpload={handleImageUpload}
                onWebcamClick={() => setShowWebcam(true)}
                onReset={resetState}
                disabled={isLoading}
                hasResult={image !== null}
              />
              <div className="space-y-4">
                  <div className="flex border-b border-slate-700">
                    <button 
                        onClick={() => setActiveTab('vocabulary')} 
                        className={`${tabButtonClasses} ${activeTab === 'vocabulary' ? activeTabClasses : inactiveTabClasses}`}
                    >
                       <BookIcon className="w-5 h-5" /> My Vocabulary
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')} 
                        className={`${tabButtonClasses} ${activeTab === 'history' ? activeTabClasses : inactiveTabClasses}`}
                    >
                       <HistoryIcon className="w-5 h-5" /> History
                    </button>
                  </div>
                  <div className="pt-2">
                    {activeTab === 'vocabulary' ? (
                        <VocabularyPanel
                            vocabulary={vocabulary}
                            onClear={handleClearVocabulary}
                            disabled={isLoading}
                        />
                    ) : (
                        <HistoryPanel
                            history={history}
                            onLoad={loadFromHistory}
                            onClear={handleClearHistory}
                            disabled={isLoading}
                        />
                    )}
                  </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-9">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-3xl p-4 md:p-6 min-h-[70vh] flex flex-col items-center justify-center shadow-2xl">
              {renderContent()}
            </div>
          </div>
        </div>
      </main>
      {showWebcam && (
        <WebcamCapture
          onCapture={handleWebcamCapture}
          onClose={() => setShowWebcam(false)}
        />
      )}
    </div>
  );
};

export default App;