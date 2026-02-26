import React from 'react';

import { getTranslation } from '@/lib/i18n/locales';
import { useUIStore } from '@/stores/useUIStore';
import { I18nContext, type I18nContextValue } from './i18n-context';

type TranslateParams = Record<string, string | number>;

const interpolate = (template: string, params?: TranslateParams): string => {
  if (!params) {
    return template;
  }

  return template.replace(/\{([a-zA-Z0-9_.-]+)\}/g, (_match, paramKey: string) => {
    const value = params[paramKey];
    return value === undefined ? `{${paramKey}}` : String(value);
  });
};

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const language = useUIStore((state) => state.appLanguage);

  const value = React.useMemo<I18nContextValue>(() => ({
    language,
    t: (key, params) => {
      const message = getTranslation(language, key) ?? getTranslation('en', key) ?? key;
      return interpolate(message, params);
    },
  }), [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};
