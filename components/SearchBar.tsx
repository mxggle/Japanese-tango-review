import React, { useState, useRef, useEffect } from 'react';
import { SearchIcon, CogIcon } from '../constants/icons';
import { SearchScope } from '../types';

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  scrollToLastWatched: () => void;
  toggleAll: (show: boolean) => void;
  blurFurigana: boolean;
  setBlurFurigana: (value: boolean | ((prev: boolean) => boolean)) => void;
  wordTypeFilter: string;
  setWordTypeFilter: (filter: string) => void;
  levelFilter: string;
  setLevelFilter: (level: string) => void;
  levelOptions: string[];
  searchMode: SearchScope;
  setSearchMode: (mode: SearchScope) => void;
  showGemini: boolean;
  setShowGemini: (value: boolean | ((prev: boolean) => boolean)) => void;
  isGeminiAvailable: boolean;
  currentDictionaryTitle: string;
  onRequestDictionaryChange: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  searchTerm, 
  setSearchTerm, 
  scrollToLastWatched, 
  toggleAll,
  blurFurigana,
  setBlurFurigana,
  wordTypeFilter,
  setWordTypeFilter,
  levelFilter,
  setLevelFilter,
  levelOptions,
  searchMode,
  setSearchMode,
  showGemini,
  setShowGemini,
  isGeminiAvailable,
  currentDictionaryTitle,
  onRequestDictionaryChange,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-md p-4 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-2 flex-grow">
          <div className="px-1">
            <p className="text-xs uppercase font-semibold tracking-wide text-slate-500 dark:text-slate-400">
              Dictionary
            </p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {currentDictionaryTitle}
            </p>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search tango..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-slate-400" />
            </div>
          </div>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(prev => !prev)}
            className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="Open settings menu"
            aria-expanded={isMenuOpen}
          >
            <CogIcon className="w-6 h-6" />
          </button>
          
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-lg shadow-xl border dark:border-slate-700 overflow-hidden z-10">
              <div className="p-2 space-y-1">
                <button
                  onClick={() => {
                    onRequestDictionaryChange();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-transparent rounded-md hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 transition-colors"
                >
                  Switch Dictionary
                </button>
                <button
                  onClick={() => {
                    scrollToLastWatched();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-transparent rounded-md hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 transition-colors"
                >
                  Scroll to Last Watched
                </button>
                <button
                  onClick={() => {
                    toggleAll(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-transparent rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Show All Definitions
                </button>
                <button
                  onClick={() => {
                    toggleAll(false);
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-transparent rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Hide All Definitions
                </button>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 p-2">
                <label className="px-2 pt-1 pb-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Search Mode
                </label>
                <div className="grid grid-cols-2 gap-2 px-1">
                  {(
                    [
                      { key: 'word', label: 'Word Only' },
                      { key: 'full', label: 'Full Content' },
                    ] as { key: SearchScope; label: string }[]
                  ).map(option => (
                    <button
                      key={option.key}
                      onClick={() => {
                        setSearchMode(option.key);
                        setIsMenuOpen(false);
                      }}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors text-center ${
                        searchMode === option.key
                          ? 'bg-blue-500 text-white'
                          : 'text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 p-2">
                <label className="px-2 pt-1 pb-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Filter by Type
                </label>
                <div className="grid grid-cols-2 gap-2 px-1">
                  {(['all', 'kanji', 'katakana', 'hiragana'] as const).map(filter => {
                    const labels: Record<typeof filter, string> = {
                      all: 'All',
                      kanji: 'Kanji',
                      katakana: 'Katakana',
                      hiragana: 'Hiragana',
                    };
                    return (
                      <button
                        key={filter}
                        onClick={() => {
                          setWordTypeFilter(filter);
                          setIsMenuOpen(false);
                        }}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors text-center ${
                          wordTypeFilter === filter
                            ? 'bg-blue-500 text-white'
                            : 'text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {labels[filter]}
                      </button>
                    );
                  })}
                </div>
              </div>
              {levelOptions.length > 0 && (
                <div className="border-t border-slate-200 dark:border-slate-700 p-2">
                  <label className="px-2 pt-1 pb-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Filter by Level
                  </label>
                  <div className="grid grid-cols-2 gap-2 px-1">
                    {['all', ...levelOptions].map(level => (
                      <button
                        key={level}
                        onClick={() => {
                          setLevelFilter(level);
                          setIsMenuOpen(false);
                        }}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors text-center ${
                          levelFilter === level
                            ? 'bg-blue-500 text-white'
                            : 'text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {level === 'all' ? 'All Levels' : level}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="border-t border-slate-200 dark:border-slate-700 p-2 space-y-2">
                <div className="flex items-center justify-between gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-md">
                  <label htmlFor="blur-toggle" className="cursor-pointer flex-grow">
                    Blur Furigana
                  </label>
                  <button
                    role="switch"
                    aria-checked={blurFurigana}
                    id="blur-toggle"
                    onClick={() => setBlurFurigana(prev => !prev)}
                    className={`${
                      blurFurigana ? 'bg-blue-600' : 'bg-slate-400 dark:bg-slate-500'
                    } relative inline-flex items-center h-6 rounded-full w-11 transition-colors flex-shrink-0`}
                  >
                    <span
                      className={`${
                        blurFurigana ? 'translate-x-6' : 'translate-x-1'
                      } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-md">
                  <label htmlFor="gemini-toggle" className="cursor-pointer flex-grow">
                    Show Gemini Sensei
                    {!isGeminiAvailable && (
                      <span className="block text-xs font-normal text-slate-400 dark:text-slate-500">
                        Disabled
                      </span>
                    )}
                  </label>
                  <button
                    role="switch"
                    aria-checked={showGemini}
                    id="gemini-toggle"
                    onClick={() => {
                      if (!isGeminiAvailable) return;
                      setShowGemini(prev => !prev);
                    }}
                    disabled={!isGeminiAvailable}
                    className={`${
                      showGemini ? 'bg-blue-600' : 'bg-slate-400 dark:bg-slate-500'
                    } relative inline-flex items-center h-6 rounded-full w-11 transition-colors flex-shrink-0 ${
                      isGeminiAvailable ? '' : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <span
                      className={`${
                        showGemini ? 'translate-x-6' : 'translate-x-1'
                      } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
