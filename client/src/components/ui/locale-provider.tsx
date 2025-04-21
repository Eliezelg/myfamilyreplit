import React, { createContext, useContext, useState, ReactNode } from 'react';

type LocaleContextType = {
  locale: string;
  setLocale: (locale: string) => void;
  dir: 'rtl' | 'ltr';
};

const LocaleContext = createContext<LocaleContextType>({
  locale: 'he',
  setLocale: () => {},
  dir: 'rtl',
});

export const useLocale = () => useContext(LocaleContext);

type LocaleProviderProps = {
  children: ReactNode;
  initialLocale?: string;
};

export const LocaleProvider: React.FC<LocaleProviderProps> = ({
  children,
  initialLocale = 'he',
}) => {
  const [locale, setLocale] = useState(initialLocale);

  // Determine text direction based on locale
  const dir = locale === 'he' || locale === 'ar' ? 'rtl' : 'ltr';

  // Update document direction when locale changes
  React.useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
  }, [locale, dir]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, dir }}>
      {children}
    </LocaleContext.Provider>
  );
};
