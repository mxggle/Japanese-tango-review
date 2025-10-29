import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { TangoWord, SearchScope, DictionaryMeta } from './types';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import TangoCard from './components/TangoCard';
import DictionarySelector from './components/DictionarySelector';
import { parseTangoData } from './services/dataParser';

type DictionaryModule = {
  rawData?: string;
  dictionaryInfo?: {
    id?: string;
    title?: string;
    description?: string;
  };
};

type DictionaryDescriptor = DictionaryMeta & {
  rawData: string;
};

const dictionaryModules = import.meta.glob('./constants/*.{ts,tsx}', {
  eager: true,
}) as Record<string, DictionaryModule>;

const DICTIONARIES: DictionaryDescriptor[] = Object.entries(dictionaryModules)
  .flatMap(([path, mod]) => {
    if (!mod || typeof mod.rawData !== 'string') {
      return [];
    }
    const fileName = path.split('/').pop() ?? path;
    const baseId = fileName.replace(/\.[tj]sx?$/, '');
    const info = mod.dictionaryInfo ?? {};
    const id = info.id?.trim() || baseId;
    const title = info.title?.trim() || baseId;
    const description = info.description?.trim() || `Data source: ${fileName}`;

    return [
      {
        id,
        title,
        description,
        sourcePath: path,
        rawData: mod.rawData,
      },
    ];
  })
  .sort((a, b) => a.title.localeCompare(b.title));

const INITIAL_VISIBLE_COUNT = 40;
const VISIBLE_INCREMENT = 30;

const KANJI_REGEX = /[\u4e00-\u9faf]/;
const KATAKANA_REGEX = /^[\u30a0-\u30ff\u30fb\u30fc]+$/;
const HIRAGANA_REGEX = /^[\u3040-\u309f]+$/;

const getStorageItem = (key: string): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const setStorageItem = (key: string, value: string) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures
  }
};

const removeStorageItem = (key: string) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage failures
  }
};

const App: React.FC = () => {
  const [selectedDictionaryId, setSelectedDictionaryId] = useState<string | null>(
    () => getStorageItem('selectedDictionaryId')
  );
  const [words, setWords] = useState<TangoWord[]>([]);
  const [levelOptions, setLevelOptions] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [wordTypeFilter, setWordTypeFilter] = useState<string>(() => getStorageItem('wordTypeFilter') || 'all');
  const [levelFilter, setLevelFilter] = useState<string>(() => getStorageItem('levelFilter') || 'all');
  const [searchMode, setSearchMode] = useState<SearchScope>(() =>
    getStorageItem('searchMode') === 'word' ? 'word' : 'full'
  );
  const showGemini = false;
  const setShowGemini = useCallback<(value: boolean | ((prev: boolean) => boolean)) => void>((_value) => {
    // Gemini Sensei integration is disabled.
  }, []);
  const isGeminiAvailable = false;

  const [blurFurigana, setBlurFurigana] = useState<boolean>(() => getStorageItem('blurFurigana') === 'true');
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [lastWatchedId, setLastWatchedId] = useState<string | null>(null);

  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_VISIBLE_COUNT);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const filteredListRef = useRef<TangoWord[]>([]);

  const dictionaries = useMemo(() => DICTIONARIES, []);

  const selectedDictionary = useMemo(() => {
    if (!selectedDictionaryId) {
      return null;
    }
    return dictionaries.find(dict => dict.id === selectedDictionaryId) ?? null;
  }, [selectedDictionaryId, dictionaries]);

  useEffect(() => {
    if (selectedDictionaryId && !selectedDictionary) {
      setSelectedDictionaryId(null);
    }
  }, [selectedDictionaryId, selectedDictionary]);

  useEffect(() => {
    if (selectedDictionaryId) {
      setStorageItem('selectedDictionaryId', selectedDictionaryId);
    } else {
      removeStorageItem('selectedDictionaryId');
    }
  }, [selectedDictionaryId]);

  useEffect(() => {
    if (!selectedDictionary) {
      setWords([]);
      setLevelOptions([]);
      return;
    }

    const parsedData = parseTangoData(selectedDictionary.rawData);
    setWords(parsedData);

    const uniqueLevels = Array.from(
      new Set(parsedData.map(word => word.level).filter((level): level is string => Boolean(level)))
    ).sort((a, b) => {
      const rank = (value: string) => {
        const match = value.match(/^N(\d)/);
        return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
      };
      return rank(a) - rank(b);
    });
    setLevelOptions(uniqueLevels);
    setLevelFilter(prev => {
      if (prev === 'all' || uniqueLevels.includes(prev)) {
        return prev;
      }
      return 'all';
    });
  }, [selectedDictionary]);

  useEffect(() => {
    if (!selectedDictionaryId) {
      setRevealedIds(new Set());
      setLastWatchedId(null);
      return;
    }

    const revealedKey = `${selectedDictionaryId}:revealedTangoIds`;
    const lastWatchedKey = `${selectedDictionaryId}:lastWatchedTangoId`;

    const storedRevealed = getStorageItem(revealedKey);
    if (storedRevealed) {
      try {
        setRevealedIds(new Set(JSON.parse(storedRevealed)));
      } catch {
        setRevealedIds(new Set());
      }
    } else {
      setRevealedIds(new Set());
    }

    const storedLastWatched = getStorageItem(lastWatchedKey);
    setLastWatchedId(storedLastWatched ? storedLastWatched : null);
  }, [selectedDictionaryId]);

  useEffect(() => {
    setStorageItem('blurFurigana', String(blurFurigana));
  }, [blurFurigana]);

  useEffect(() => {
    setStorageItem('wordTypeFilter', wordTypeFilter);
  }, [wordTypeFilter]);

  useEffect(() => {
    setStorageItem('levelFilter', levelFilter);
  }, [levelFilter]);

  useEffect(() => {
    setStorageItem('searchMode', searchMode);
  }, [searchMode]);

  useEffect(() => {
    if (!selectedDictionaryId) {
      return;
    }
    setStorageItem(`${selectedDictionaryId}:revealedTangoIds`, JSON.stringify(Array.from(revealedIds)));
  }, [revealedIds, selectedDictionaryId]);

  useEffect(() => {
    if (!selectedDictionaryId) {
      return;
    }
    if (lastWatchedId) {
      setStorageItem(`${selectedDictionaryId}:lastWatchedTangoId`, lastWatchedId);
    } else {
      removeStorageItem(`${selectedDictionaryId}:lastWatchedTangoId`);
    }
  }, [lastWatchedId, selectedDictionaryId]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [searchTerm, wordTypeFilter, levelFilter, searchMode, words]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setVisibleCount(prev => {
            if (prev >= words.length) {
              return prev;
            }
            return Math.min(prev + VISIBLE_INCREMENT, words.length);
          });
        }
      },
      { root: null, rootMargin: '200px' }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [words.length]);

  const filteredWords = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();

    return words.filter(word => {
      if (normalizedTerm) {
        if (searchMode === 'word') {
          const expressionMatch = word.expression.toLowerCase().includes(normalizedTerm);
          const readingMatch = word.reading.toLowerCase().includes(normalizedTerm);
          if (!expressionMatch && !readingMatch) {
            return false;
          }
        } else {
          const searchable = [
            word.expression,
            word.reading,
            word.definition,
            word.partOfSpeech,
            word.examples.map(ex => `${ex.jp} ${ex.cn}`).join(' '),
            word.related.map(rel => `${rel.type} ${rel.jp} ${rel.cn}`).join(' '),
          ]
            .join(' ')
            .toLowerCase();

          if (!searchable.includes(normalizedTerm)) {
            return false;
          }
        }
      }

      if (wordTypeFilter !== 'all') {
        if (wordTypeFilter === 'kanji' && !KANJI_REGEX.test(word.expression)) {
          return false;
        }
        if (wordTypeFilter === 'katakana' && !KATAKANA_REGEX.test(word.expression)) {
          return false;
        }
        if (wordTypeFilter === 'hiragana' && !HIRAGANA_REGEX.test(word.expression)) {
          return false;
        }
      }

      if (levelFilter !== 'all' && word.level !== levelFilter) {
        return false;
      }

      return true;
    });
  }, [words, searchTerm, searchMode, wordTypeFilter, levelFilter]);

  const visibleWords = useMemo(
    () => filteredWords.slice(0, Math.min(visibleCount, filteredWords.length)),
    [filteredWords, visibleCount]
  );

  useEffect(() => {
    filteredListRef.current = filteredWords;
  }, [filteredWords]);

  const handleToggleAiPanel = useCallback(() => {
    // Gemini Sensei integration is disabled.
  }, []);

  const handleToggleDefinition = useCallback((id: string) => {
    setRevealedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleSetLastWatched = useCallback((id: string) => {
    setLastWatchedId(id);
  }, []);

  const scrollToLastWatched = useCallback(() => {
    if (!lastWatchedId) {
      return;
    }

    const currentList = filteredListRef.current;
    const targetIndex = currentList.findIndex(word => word.id === lastWatchedId);
    if (targetIndex === -1) {
      return;
    }

    setVisibleCount(prev => {
      if (targetIndex < prev) {
        return prev;
      }
      return Math.min(currentList.length, targetIndex + VISIBLE_INCREMENT);
    });

    requestAnimationFrame(() => {
      const element = document.getElementById(lastWatchedId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }, [lastWatchedId]);

  const toggleAll = useCallback(
    (show: boolean) => {
      if (show) {
        const allIds = new Set(words.map(w => w.id));
        setRevealedIds(allIds);
      } else {
        setRevealedIds(new Set());
      }
    },
    [words]
  );

  const handleSelectDictionary = useCallback((id: string) => {
    setSelectedDictionaryId(id);
    setSearchTerm('');
  }, []);

  const handleRequestDictionaryChange = useCallback(() => {
    setSelectedDictionaryId(null);
    setSearchTerm('');
  }, []);

  if (!selectedDictionary) {
    const selectorOptions = dictionaries.map(dict => ({
      id: dict.id,
      title: dict.title,
      description: dict.description,
    }));
    return (
      <DictionarySelector
        dictionaries={selectorOptions}
        onSelect={handleSelectDictionary}
      />
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="sticky top-0 z-20">
        <SearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          scrollToLastWatched={scrollToLastWatched}
          toggleAll={toggleAll}
          blurFurigana={blurFurigana}
          setBlurFurigana={setBlurFurigana}
          wordTypeFilter={wordTypeFilter}
          setWordTypeFilter={setWordTypeFilter}
          levelFilter={levelFilter}
          setLevelFilter={setLevelFilter}
          levelOptions={levelOptions}
          searchMode={searchMode}
          setSearchMode={setSearchMode}
          showGemini={showGemini}
          setShowGemini={setShowGemini}
          isGeminiAvailable={isGeminiAvailable}
          currentDictionaryTitle={selectedDictionary.title}
          onRequestDictionaryChange={handleRequestDictionaryChange}
        />
      </div>

      <main className="max-w-7xl mx-auto p-4">
        {words.length === 0 ? (
          <div className="text-center text-slate-500">Loading data...</div>
        ) : filteredWords.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleWords.map(word => (
                <TangoCard
                  key={word.id}
                  word={word}
                  isDefinitionVisible={revealedIds.has(word.id)}
                  onToggleDefinition={() => handleToggleDefinition(word.id)}
                  isLastWatched={lastWatchedId === word.id}
                  onSetLastWatched={() => handleSetLastWatched(word.id)}
                  isAiPanelVisible={false}
                  onToggleAiPanel={handleToggleAiPanel}
                  aiContent={null}
                  isAiLoading={false}
                  aiError={null}
                  blurFurigana={blurFurigana}
                  showGemini={showGemini}
                />
              ))}
            </div>
            {filteredWords.length > 0 && (
              <div
                ref={visibleCount < filteredWords.length ? sentinelRef : null}
                className="py-6 text-center text-slate-400 text-sm"
              >
                {visibleCount < filteredWords.length ? 'Loading more words...' : 'You have reached the end.'}
              </div>
            )}
          </>
        ) : (
          searchTerm && (
            <div className="text-center text-slate-500 py-10">
              <p className="text-lg">
                No words found for &quot;{searchTerm}&quot;.
              </p>
            </div>
          )
        )}
      </main>
    </div>
  );
};

export default App;
