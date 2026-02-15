import React from 'react';
import { NavLink } from 'react-router-dom';

export const BottomNav: React.FC = () => {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/workout', label: 'Workout', icon: '💪' },
    { path: '/nutrition', label: 'Nutrition', icon: '🥗' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <nav className="bg-gray-800 border-t border-gray-700 fixed bottom-0 left-0 right-0 z-20">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-4 gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-3 text-sm font-medium transition-colors min-h-[64px] ${
                  isActive
                    ? 'text-primary-400 bg-gray-700/50'
                    : 'text-gray-400 hover:text-gray-300'
                }`
              }
            >
              <span className="text-2xl mb-1">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};
