import React, { useRef, useEffect } from 'react';
import { TangoWord } from '../types';
import { EyeIcon, EyeOffIcon, BookmarkIcon, SparklesIcon } from '../constants/icons';

interface TangoCardProps {
  word: TangoWord;
  isDefinitionVisible: boolean;
  onToggleDefinition: () => void;
  isLastWatched: boolean;
  onSetLastWatched: () => void;
  isAiPanelVisible: boolean;
  onToggleAiPanel: () => void;
  aiContent: string | null;
  isAiLoading: boolean;
  aiError: string | null;
  blurFurigana: boolean;
}

const TangoCard: React.FC<TangoCardProps> = ({ 
  word, 
  isDefinitionVisible, 
  onToggleDefinition,
  isLastWatched,
  onSetLastWatched,
  isAiPanelVisible,
  onToggleAiPanel,
  aiContent,
  isAiLoading,
  aiError,
  blurFurigana
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLastWatched && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isLastWatched]);

  const cardClasses = `
    bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 
    overflow-hidden border border-slate-200 dark:border-slate-700
    ${isLastWatched ? 'ring-2 ring-blue-500' : ''}
    ${blurFurigana ? 'furigana-blur' : ''}
  `;

  const definitionClasses = `
    px-4 sm:px-6 pb-4 sm:pb-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50
  `;

  return (
    <div id={word.id} ref={cardRef} className={cardClasses}>
      <div className="p-4 sm:p-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-baseline gap-4">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                  <ruby>
                    {word.expression}
                    <rt className="text-lg text-slate-500 dark:text-slate-400 font-normal">{word.reading}</rt>
                  </ruby>
                </h2>
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-slate-600 dark:text-slate-400">
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300">{word.partOfSpeech}</span>
                <span>{word.pitchAccent}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={onToggleAiPanel} className={`p-2 transition-colors ${isAiPanelVisible ? 'text-purple-500' : 'text-slate-400 hover:text-purple-500'}`} title="Ask Gemini Sensei">
              <SparklesIcon className="w-6 h-6" />
            </button>
            <button onClick={onToggleDefinition} className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title={isDefinitionVisible ? "Hide Definition" : "Show Definition"}>
              {isDefinitionVisible ? <EyeOffIcon className="w-6 h-6" /> : <EyeIcon className="w-6 h-6" />}
            </button>
             <button onClick={onSetLastWatched} className={`p-2 transition-colors ${isLastWatched ? 'text-blue-500' : 'text-slate-400 hover:text-blue-500'}`} title="Mark as Last Watched">
              <BookmarkIcon className="w-6 h-6" isFilled={isLastWatched} />
            </button>
          </div>
        </div>
      </div>
      
      {isDefinitionVisible && (
        <div className={definitionClasses}>
          <div className="mt-4">
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">{word.definition}</h3>
            
            {word.examples.length > 0 && (
              <div className="mt-4 space-y-3">
                <h4 className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400">Examples</h4>
                {word.examples.map((ex, index) => (
                  <div key={index} className="pl-4 border-l-2 border-slate-300 dark:border-slate-600">
                    <p className="text-lg text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: ex.jp }} />
                    <p className="text-md text-slate-500 dark:text-slate-400">{ex.cn}</p>
                  </div>
                ))}
              </div>
            )}

            {word.related.length > 0 && (
              <div className="mt-4 space-y-3">
                <h4 className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400">Related</h4>
                {word.related.map((rel, index) => (
                  <div key={index} className="pl-4 border-l-2 border-slate-300 dark:border-slate-600">
                    <p className="text-lg text-slate-700 dark:text-slate-300">
                      <span className="text-sm bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-md mr-2">{rel.type}</span>
                      <span dangerouslySetInnerHTML={{ __html: rel.jp }} />
                    </p>
                    <p className="text-md text-slate-500 dark:text-slate-400">{rel.cn}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {isAiPanelVisible && (
            <div className="mt-6 pt-4 border-t-2 border-dashed border-purple-200 dark:border-purple-800">
              <h4 className="text-sm font-bold uppercase text-purple-500 dark:text-purple-400 mb-3 flex items-center gap-2">
                <SparklesIcon className="w-4 h-4" />
                Gemini Sensei's Insights
              </h4>
              {isAiLoading && <div className="text-slate-500 dark:text-slate-400 animate-pulse">Thinking...</div>}
              {aiError && <div className="text-red-500 dark:text-red-400">{aiError}</div>}
              {aiContent && !isAiLoading && (
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap font-sans text-slate-700 dark:text-slate-300">
                  {aiContent}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TangoCard;