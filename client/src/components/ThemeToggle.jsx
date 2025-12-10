'use client';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme, isReady } = useTheme();
  const nextMode = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextMode} mode`}
      aria-pressed={theme === 'dark'}
      disabled={!isReady}
      className={`relative inline-flex h-6 w-11 items-center rounded-full border border-gray-300 bg-gray-200 transition disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-600 dark:bg-gray-800 ${className}`}
    >
      <span
        className={`inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-white text-xs shadow transition dark:bg-gray-200 ${
          theme === 'dark' ? 'translate-x-[18px]' : 'translate-x-[2px]'
        }`}
      >
        {theme === 'dark' ? '🌙' : '☀️'}
      </span>
    </button>
  );
}
