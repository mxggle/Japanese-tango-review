import React from 'react';

interface DictionaryOption {
  id: string;
  title: string;
  description?: string;
}

interface DictionarySelectorProps {
  dictionaries: DictionaryOption[];
  onSelect: (id: string) => void;
}

const DictionarySelector: React.FC<DictionarySelectorProps> = ({ dictionaries, onSelect }) => {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 flex flex-col">
      <header className="py-8 text-center">
        <h1 className="text-3xl font-bold">Choose Your Dictionary</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Select a deck to start reviewing vocabulary.
        </p>
      </header>
      <main className="flex-1 px-4 pb-10">
        <div className="max-w-4xl mx-auto grid gap-4 sm:grid-cols-2">
          {dictionaries.map(dictionary => (
            <button
              key={dictionary.id}
              onClick={() => onSelect(dictionary.id)}
              className="text-left bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{dictionary.title}</h2>
              {dictionary.description && (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{dictionary.description}</p>
              )}
            </button>
          ))}
          {dictionaries.length === 0 && (
            <div className="col-span-full text-center text-slate-500 dark:text-slate-400">
              No dictionaries were found in the constants directory.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DictionarySelector;
