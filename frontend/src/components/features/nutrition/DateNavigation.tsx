import React, { useRef } from 'react';
import { format, addDays, subDays, isToday } from 'date-fns';

interface DateNavigationProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export default function DateNavigation({ selectedDate, onDateChange }: DateNavigationProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handlePrevDay = () => {
    onDateChange(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    onDateChange(addDays(selectedDate, 1));
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const handleDateClick = () => {
    dateInputRef.current?.showPicker();
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value + 'T00:00:00');
    onDateChange(newDate);
  };

  const formattedDate = format(selectedDate, 'EEE, MMM d, yyyy');
  const isoDate = format(selectedDate, 'yyyy-MM-dd');
  const showTodayButton = !isToday(selectedDate);

  return (
    <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Previous Day Button */}
        <button
          onClick={handlePrevDay}
          className="flex items-center justify-center w-11 h-11 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
          aria-label="Previous day"
        >
          <svg
            className="w-6 h-6 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Date Display (tappable) */}
        <button
          onClick={handleDateClick}
          className="flex-1 mx-3 text-lg font-medium text-gray-100 hover:text-gray-300 transition-colors text-center py-2"
        >
          {formattedDate}
        </button>

        {/* Hidden Date Input */}
        <input
          ref={dateInputRef}
          type="date"
          value={isoDate}
          onChange={handleDateInputChange}
          className="absolute opacity-0 pointer-events-none"
          aria-hidden="true"
        />

        {/* Next Day Button */}
        <button
          onClick={handleNextDay}
          className="flex items-center justify-center w-11 h-11 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
          aria-label="Next day"
        >
          <svg
            className="w-6 h-6 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        {/* Today Button (conditional) */}
        {showTodayButton && (
          <button
            onClick={handleToday}
            className="ml-3 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Today
          </button>
        )}
      </div>
    </div>
  );
}
