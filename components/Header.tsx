import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center py-2 sm:py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">Japanese Tango Reviewer</h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Review, Search, and Memorize with your AI Sensei</p>
      </div>
    </header>
  );
};

export default Header;
