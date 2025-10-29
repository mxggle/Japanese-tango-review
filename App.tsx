import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { TangoWord } from './types';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import TangoCard from './components/TangoCard';
import { parseTangoData } from './services/dataParser';
import { rawData } from './constants/data';

const App: React.FC = () => {
  const [words, setWords] = useState<TangoWord[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [wordTypeFilter, setWordTypeFilter] = useState<string>('all');
  
  // Furigana blur state
  const [blurFurigana, setBlurFurigana] = useState<boolean>(() => {
    try {
        return localStorage.getItem('blurFurigana') === 'true';
    } catch (e) {
        return false;
    }
  });

  const [revealedIds, setRevealedIds] = useState<Set<string>>(() => {
    try {
      const item = window.localStorage.getItem('revealedTangoIds');
      return item ? new Set(JSON.parse(item)) : new Set();
    } catch (error) {
      return new Set();
    }
  });
  const [lastWatchedId, setLastWatchedId] = useState<string | null>(() => {
    try {
        return window.localStorage.getItem('lastWatchedTangoId');
    } catch(e) {
        return null;
    }
  });

  const [aiInsights, setAiInsights] = useState<Record<string, { content: string | null; isLoading: boolean; error: string | null; }>>({});
  const [visibleAiPanels, setVisibleAiPanels] = useState<Set<string>>(new Set());
  
  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY }), []);

  // Effect for furigana blur
  useEffect(() => {
    try {
        localStorage.setItem('blurFurigana', String(blurFurigana));
    } catch(e) {
        console.warn('Could not save blurFurigana preference to localStorage.');
    }
  }, [blurFurigana]);


  useEffect(() => {
    const parsedData = parseTangoData(rawData);
    setWords(parsedData);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('revealedTangoIds', JSON.stringify(Array.from(revealedIds)));
    } catch (error) {
      console.error("Could not save revealed IDs to localStorage", error);
    }
  }, [revealedIds]);

  useEffect(() => {
    try {
        if (lastWatchedId) {
            window.localStorage.setItem('lastWatchedTangoId', lastWatchedId);
        } else {
            window.localStorage.removeItem('lastWatchedTangoId');
        }
    } catch (e) {
        console.warn('Could not save lastWatchedId to localStorage.');
    }
  }, [lastWatchedId]);


  const filteredWords = useMemo(() => {
    const searchFiltered = searchTerm
      ? words.filter(word =>
          word.expression.toLowerCase().includes(searchTerm.toLowerCase()) ||
          word.reading.toLowerCase().includes(searchTerm.toLowerCase()) ||
          word.definition.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : words;

    if (wordTypeFilter === 'all') {
      return searchFiltered;
    }

    return searchFiltered.filter(word => {
      if (wordTypeFilter === 'kanji') {
        // Contains at least one Kanji
        return /[\u4e00-\u9faf]/.test(word.expression);
      }
      if (wordTypeFilter === 'katakana') {
        // Consists only of Katakana characters (and ー・)
        return /^[\u30a0-\u30ff\u30fb\u30fc]+$/.test(word.expression);
      }
      if (wordTypeFilter === 'hiragana') {
        // Consists only of Hiragana characters
        return /^[\u3040-\u309f]+$/.test(word.expression);
      }
      return true;
    });
  }, [searchTerm, words, wordTypeFilter]);
  
  const handleToggleAiPanel = useCallback(async (word: TangoWord) => {
    const { id, expression, reading, partOfSpeech, definition } = word;

    const isOpening = !visibleAiPanels.has(id);
    
    setVisibleAiPanels(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        return newSet;
    });

    if (isOpening && !aiInsights[id]) {
        setAiInsights(prev => ({ ...prev, [id]: { content: null, isLoading: true, error: null } }));

        try {
            const prompt = `
You are a helpful and friendly Japanese language tutor named "Gemini Sensei".
A user wants to understand the word "${expression}" [${reading}] better.
The word is a ${partOfSpeech} and its basic definition is: "${definition}".

Please provide a concise and clear explanation for a Japanese language learner. Structure your response in English with the following sections using Markdown headings:

### Deeper Meaning & Nuance
Explain the word's nuances, common contexts, and any cultural significance if applicable. If there are similar words, briefly explain the difference.

### More Examples
Provide 2-3 new, practical example sentences. For each example, provide the Japanese sentence (with the target word in bold), its reading in furigana style (e.g., 日本[にほん]), and the English translation.

### Mnemonic
Provide a simple and memorable mnemonic to help remember the word.

Keep your response friendly and encouraging!
`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            const text = response.text;
            
            setAiInsights(prev => ({ ...prev, [id]: { content: text, isLoading: false, error: null } }));

        } catch (error) {
            console.error("Error fetching AI insight:", error);
            setAiInsights(prev => ({ ...prev, [id]: { content: null, isLoading: false, error: 'Sorry, I had trouble thinking of an explanation. Please try again.' } }));
        }
    }
  }, [visibleAiPanels, aiInsights, ai]);

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
    if (lastWatchedId) {
      const element = document.getElementById(lastWatchedId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [lastWatchedId]);

  const toggleAll = useCallback((show: boolean) => {
        if(show) {
            const allIds = new Set(words.map(w => w.id));
            setRevealedIds(allIds);
        } else {
            setRevealedIds(new Set());
        }
  }, [words]);

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
        />
      </div>
      
      <main className="max-w-7xl mx-auto p-4">
        {words.length === 0 ? (
          <div className="text-center text-slate-500">Loading data...</div>
        ) : filteredWords.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredWords.map(word => (
              <TangoCard
                key={word.id}
                word={word}
                isDefinitionVisible={revealedIds.has(word.id)}
                onToggleDefinition={() => handleToggleDefinition(word.id)}
                isLastWatched={lastWatchedId === word.id}
                onSetLastWatched={() => handleSetLastWatched(word.id)}
                isAiPanelVisible={visibleAiPanels.has(word.id)}
                onToggleAiPanel={() => handleToggleAiPanel(word)}
                aiContent={aiInsights[word.id]?.content ?? null}
                isAiLoading={aiInsights[word.id]?.isLoading ?? false}
                aiError={aiInsights[word.id]?.error ?? null}
                blurFurigana={blurFurigana}
              />
            ))}
          </div>
        ) : (
          searchTerm && (
            <div className="text-center text-slate-500 py-10">
                <p className="text-lg">No words found for "{searchTerm}".</p>
            </div>
          )
        )}
      </main>
    </div>
  );
};

export default App;