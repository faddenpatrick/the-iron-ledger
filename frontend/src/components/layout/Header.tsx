import React from 'react';
import { useSync } from '../../context/SyncContext';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const { isOnline, syncStatus } = useSync();

  return (
    <header className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700/60 px-4 py-3 sticky top-0 z-10 shadow-lg shadow-black/30">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <img
            src="/assets/logo.png"
            alt="The Iron Ledger"
            className="h-11 w-11 object-contain rounded-lg"
          />
          <div>
            <h1 className="text-lg font-bold text-white leading-tight font-display tracking-wide">
              {title}
            </h1>
            <p className="text-xs font-display font-semibold tracking-widest uppercase text-brand-gold">
              The Iron Ledger
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isOnline && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-900/30 border border-yellow-500/30 rounded-full text-xs text-yellow-400 font-medium">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Offline</span>
            </div>
          )}
          {syncStatus.isSyncing && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-900/30 border border-blue-500/30 rounded-full text-xs text-blue-400 font-medium">
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Syncing</span>
            </div>
          )}
          {syncStatus.pendingCount > 0 && !syncStatus.isSyncing && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-900/30 border border-orange-500/30 rounded-full text-xs text-orange-400 font-medium">
              <span>{syncStatus.pendingCount} pending</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
