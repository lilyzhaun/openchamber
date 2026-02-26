import React from 'react';

import type { AppLanguage } from '@/lib/i18n/locales';

type TranslateParams = Record<string, string | number>;

export type I18nContextValue = {
  language: AppLanguage;
  t: (key: string, params?: TranslateParams) => string;
};

export const I18nContext = React.createContext<I18nContextValue | null>(null);
