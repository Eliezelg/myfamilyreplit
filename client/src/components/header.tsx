import React from 'react';
import { Link, useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useLocale } from './ui/locale-provider';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import LocaleSwitcher from './locale-switcher';
import { HomeIcon, User, LogOut, Menu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Header = () => {
  const { t } = useTranslation('common');
  const { dir } = useLocale();
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <header className="w-full bg-background border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/">
            <span className="flex items-center space-x-2 cursor-pointer">
              <HomeIcon className="h-6 w-6" />
              <span className="text-xl font-bold">{t('app.name')}</span>
            </span>
          </Link>
        </div>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/">
            <span className={`text-sm cursor-pointer ${isActive('/') ? 'font-bold' : ''}`}>
              {t('navigation.home')}
            </span>
          </Link>
          <Link href="/features">
            <span className={`text-sm cursor-pointer ${isActive('/features') ? 'font-bold' : ''}`}>
              {t('navigation.features')}
            </span>
          </Link>
          <Link href="/about">
            <span className={`text-sm cursor-pointer ${isActive('/about') ? 'font-bold' : ''}`}>
              {t('navigation.about')}
            </span>
          </Link>
          <Link href="/contact">
            <span className={`text-sm cursor-pointer ${isActive('/contact') ? 'font-bold' : ''}`}>
              {t('navigation.contact')}
            </span>
          </Link>

          {user && (
            <Link href="/dashboard">
              <span className={`text-sm cursor-pointer ${isActive('/dashboard') ? 'font-bold' : ''}`}>
                {t('navigation.dashboard')}
              </span>
            </Link>
          )}

          {user?.role === 'admin' && (
            <Link href="/admin">
              <span className={`text-sm cursor-pointer ${isActive('/admin') ? 'font-bold' : ''}`}>
                {t('navigation.admin')}
              </span>
            </Link>
          )}
        </nav>

        <div className="flex items-center space-x-4">
          <LocaleSwitcher />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'}>
                <DropdownMenuLabel>{user?.username}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <span className="w-full cursor-pointer">
                      {t('navigation.profile')}
                    </span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('navigation.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth">
              <Button>{t('auth.login')}</Button>
            </Link>
          )}

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile navigation menu */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 py-2 bg-background border-t">
          <div className="flex flex-col space-y-3 py-3">
            <Link href="/">
              <span className={`text-sm cursor-pointer ${isActive('/') ? 'font-bold' : ''}`}>
                {t('navigation.home')}
              </span>
            </Link>
            <Link href="/features">
              <span className={`text-sm cursor-pointer ${isActive('/features') ? 'font-bold' : ''}`}>
                {t('navigation.features')}
              </span>
            </Link>
            <Link href="/about">
              <span className={`text-sm cursor-pointer ${isActive('/about') ? 'font-bold' : ''}`}>
                {t('navigation.about')}
              </span>
            </Link>
            <Link href="/contact">
              <span className={`text-sm cursor-pointer ${isActive('/contact') ? 'font-bold' : ''}`}>
                {t('navigation.contact')}
              </span>
            </Link>

            {user && (
              <Link href="/dashboard">
                <span className={`text-sm cursor-pointer ${isActive('/dashboard') ? 'font-bold' : ''}`}>
                  {t('navigation.dashboard')}
                </span>
              </Link>
            )}

            {user?.role === 'admin' && (
              <Link href="/admin">
                <span className={`text-sm cursor-pointer ${isActive('/admin') ? 'font-bold' : ''}`}>
                  {t('navigation.admin')}
                </span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;