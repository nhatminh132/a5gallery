import { useState } from 'react';
import { Settings, Palette, Monitor, Sun, Moon, Globe } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function ThemeSettings() {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
        aria-label="Theme settings"
      >
        <Settings className="w-5 h-5 text-gray-700 dark:text-gray-300" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 animate-scale-in z-50">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">{t('settings.appearance')}</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settings.theme')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {/* TODO: Add system theme */}}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                    false // TODO: Check if system theme
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <Monitor className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-xs text-gray-700 dark:text-gray-300">{t('settings.auto')}</span>
                </button>
                
                <button
                  onClick={() => theme === 'dark' && toggleTheme()}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                    theme === 'light'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-xs text-gray-700 dark:text-gray-300">{t('settings.light')}</span>
                </button>
                
                <button
                  onClick={() => theme === 'light' && toggleTheme()}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                    theme === 'dark'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-xs text-gray-700 dark:text-gray-300">{t('settings.dark')}</span>
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('settings.accentColor')}
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { name: 'Blue', color: 'bg-blue-500' },
                  { name: 'Purple', color: 'bg-purple-500' },
                  { name: 'Pink', color: 'bg-pink-500' },
                  { name: 'Green', color: 'bg-green-500' },
                  { name: 'Orange', color: 'bg-orange-500' },
                ].map((color) => (
                  <button
                    key={color.name}
                    className={`w-8 h-8 rounded-full ${color.color} hover:scale-110 transition-transform`}
                    aria-label={`Set ${color.name} theme`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {t('settings.close')}
            </button>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}