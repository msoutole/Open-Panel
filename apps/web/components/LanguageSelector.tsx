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
          <div className="flex items-center gap-2 text-sm text-textSecondary">
            <Globe size={16} strokeWidth={1.5} />
            <span>Idioma:</span>
          </div>
        )}
        <div className="flex gap-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLocale(lang.code)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                locale === lang.code
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-background text-textSecondary hover:bg-white border border-border'
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
        className="appearance-none px-4 py-2 pr-8 border border-border rounded-lg bg-white text-sm font-medium text-textPrimary hover:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary cursor-pointer transition-all duration-200"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
        <Globe size={16} className="text-textSecondary" strokeWidth={1.5} />
      </div>
    </div>
  );
};
