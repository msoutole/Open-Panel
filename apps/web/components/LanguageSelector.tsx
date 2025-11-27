import React from 'react';
import { Globe } from 'lucide-react';
import { useLocale } from '../src/i18n/i18n-react';
import type { Locales } from '../src/i18n/i18n-types';

interface LanguageSelectorProps {
  variant?: 'inline' | 'dropdown';
  showLabel?: boolean;
}

const languages: { code: Locales; name: string; flag: string }[] = [
  { code: 'pt-BR', name: 'Português (BR)', flag: '🇧🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'dropdown',
  showLabel = true
}) => {
  const [locale, setLocale] = useLocale();

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2">
        {showLabel && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Globe size={16} />
            <span>Idioma:</span>
          </div>
        )}
        <div className="flex gap-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLocale(lang.code)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                locale === lang.code
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="mr-1">{lang.flag}</span>
              {lang.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locales)}
        className="appearance-none px-4 py-2 pr-8 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
        <Globe size={16} className="text-gray-500" />
      </div>
    </div>
  );
};
