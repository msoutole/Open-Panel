/* eslint-disable */
// @ts-nocheck
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'
import type { Locales } from './i18n-types'
import { i18nObject, baseLocale, loadLocale, isLocaleLoaded } from './i18n-util'
import type { TranslationFunctions } from './i18n-types'

interface I18nContextType {
  locale: Locales
  LL: TranslationFunctions
  setLocale: (locale: Locales) => void
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

const LOCALE_STORAGE_KEY = 'openpanel_locale'

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Tentar carregar idioma do localStorage ou usar pt-BR como padrão
  const getInitialLocale = (): Locales => {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (stored && (stored === 'pt-BR' || stored === 'en')) {
      return stored as Locales
    }

    // Detectar idioma do navegador
    const browserLang = navigator.language || (navigator as any).userLanguage
    if (browserLang) {
      if (browserLang.startsWith('pt')) return 'pt-BR'
      if (browserLang.startsWith('en')) return 'en'
    }

    return baseLocale
  }

  const [locale, setLocaleState] = useState<Locales>(getInitialLocale())

  const LL = useMemo(() => {
    loadLocale(locale)
    return i18nObject(locale)
  }, [locale])

  const setLocale = (newLocale: Locales) => {
    if (newLocale === locale) return

    // Carregar locale se ainda não foi carregado
    if (!isLocaleLoaded(newLocale)) {
      loadLocale(newLocale)
    }

    setLocaleState(newLocale)
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale)

    // Atualizar atributo HTML lang
    document.documentElement.lang = newLocale
  }

  // Set initial HTML lang attribute
  useEffect(() => {
    document.documentElement.lang = locale
  }, [])

  const value: I18nContextType = {
    locale,
    LL,
    setLocale,
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export const useI18nContext = (): I18nContextType => {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18nContext must be used within I18nProvider')
  }
  return context
}

// Hook simplificado para usar apenas as traduções
export const useTranslations = (): TranslationFunctions => {
  const { LL } = useI18nContext()
  return LL
}

// Hook para obter locale atual
export const useLocale = (): [Locales, (locale: Locales) => void] => {
  const { locale, setLocale } = useI18nContext()
  return [locale, setLocale]
}
