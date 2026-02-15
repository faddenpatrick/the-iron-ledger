import React from 'react';

interface PRBadgeProps {
  isPersonalRecord?: boolean;
  className?: string;
}

export const PRBadge: React.FC<PRBadgeProps> = ({ isPersonalRecord, className = '' }) => {
  if (!isPersonalRecord) return null;

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded-lg text-xs font-bold animate-pulse ${className}`}>
      <span className="text-base">🏆</span>
      <span>PR!</span>
    </div>
  );
};
