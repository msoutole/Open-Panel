/* eslint-disable */
// @ts-nocheck
import type { Locales } from './i18n-types'
import { i18n as initI18n, i18nObject as initI18nObject } from 'typesafe-i18n'
import type { Formatters } from './i18n-types'

import pt_BR from './pt-BR'
import en from './en'

const localeTranslations = {
	'pt-BR': pt_BR,
	'en': en,
}

export const baseLocale: Locales = 'pt-BR'

export const locales: Locales[] = ['pt-BR', 'en']

export const loadedLocales: Record<Locales, boolean> = {
	'pt-BR': true,
	'en': true,
}

export const i18n = () => initI18n<Locales, Formatters>(localeTranslations[baseLocale], {} as Formatters)

export const i18nObject = (locale: Locales) =>
	initI18nObject<Locales, Formatters>(locale, localeTranslations[locale], {} as Formatters)

export const loadLocale = (locale: Locales) => {
	if (loadedLocales[locale]) {
		return
	}
	loadedLocales[locale] = true
}

export const loadAllLocales = () => locales.forEach(loadLocale)

export const isLocaleLoaded = (locale: Locales) => loadedLocales[locale]

export { detectLocale } from 'typesafe-i18n/detectors'
