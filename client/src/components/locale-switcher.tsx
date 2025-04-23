import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocale } from './ui/locale-provider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check } from 'lucide-react';

export const LocaleSwitcher = () => {
  const { t } = useTranslation('common');
  const { locale, setLocale } = useLocale();

  const languages = [
    { code: 'en', name: t('languages.en') },
    { code: 'fr', name: t('languages.fr') },
    { code: 'es', name: t('languages.es') },
    { code: 'he', name: t('languages.he') },
    { code: 'ar', name: t('languages.ar') },
    { code: 'ru', name: t('languages.ru') },
    { code: 'pt', name: t('languages.pt') },
    { code: 'de', name: t('languages.de') },
  ];

  const handleLanguageChange = (value: string) => {
    setLocale(value);
  };

  return (
    <div className="locale-switcher">
      <Select value={locale} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t('common.language')} />
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              <div className="flex items-center justify-between w-full">
                <span>{lang.name}</span>
                {locale === lang.code && <Check className="h-4 w-4 ml-2" />}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LocaleSwitcher;