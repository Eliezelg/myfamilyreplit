import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';

type LocaleContextType = {
  locale: string;
  setLocale: (locale: string) => void;
  dir: 'rtl' | 'ltr';
};

const LocaleContext = createContext<LocaleContextType>({
  locale: 'fr',
  setLocale: () => {},
  dir: 'ltr',
});

export const useLocale = () => useContext(LocaleContext);

type LocaleProviderProps = {
  children: ReactNode;
  initialLocale?: string;
};

export const LocaleProvider: React.FC<LocaleProviderProps> = ({
  children,
  initialLocale = 'fr',
}) => {
  const { i18n } = useTranslation();
  const [locale, setLocaleState] = useState(i18n.language || initialLocale);

  // Determine text direction based on locale
  const dir = locale === 'he' || locale === 'ar' ? 'rtl' : 'ltr';

  const setLocale = (newLocale: string) => {
    setLocaleState(newLocale);
    i18n.changeLanguage(newLocale);
  };

  // Initialize i18n with the current locale
  useEffect(() => {
    if (i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }
  }, [locale, i18n]);

  // Update document direction and language attribute when locale changes
  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
  }, [locale, dir]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, dir }}>
      {children}
    </LocaleContext.Provider>
  );
};
