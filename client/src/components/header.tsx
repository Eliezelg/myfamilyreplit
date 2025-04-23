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
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <header className="w-full bg-background border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/">
            <a className="flex items-center space-x-2">
              <HomeIcon className="h-6 w-6" />
              <span className="text-xl font-bold">{t('app.name')}</span>
            </a>
          </Link>
        </div>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/">
            <a className={`text-sm ${isActive('/') ? 'font-bold' : ''}`}>
              {t('navigation.home')}
            </a>
          </Link>
          <Link href="/features">
            <a className={`text-sm ${isActive('/features') ? 'font-bold' : ''}`}>
              {t('navigation.features')}
            </a>
          </Link>
          <Link href="/about">
            <a className={`text-sm ${isActive('/about') ? 'font-bold' : ''}`}>
              {t('navigation.about')}
            </a>
          </Link>
          <Link href="/contact">
            <a className={`text-sm ${isActive('/contact') ? 'font-bold' : ''}`}>
              {t('navigation.contact')}
            </a>
          </Link>

          {isAuthenticated && (
            <Link href="/dashboard">
              <a className={`text-sm ${isActive('/dashboard') ? 'font-bold' : ''}`}>
                {t('navigation.dashboard')}
              </a>
            </Link>
          )}

          {user?.role === 'admin' && (
            <Link href="/admin">
              <a className={`text-sm ${isActive('/admin') ? 'font-bold' : ''}`}>
                {t('navigation.admin')}
              </a>
            </Link>
          )}
        </nav>

        <div className="flex items-center space-x-4">
          <LocaleSwitcher />

          {isAuthenticated ? (
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
                    <a className="w-full cursor-pointer">
                      {t('navigation.profile')}
                    </a>
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
              <a className={`text-sm ${isActive('/') ? 'font-bold' : ''}`}>
                {t('navigation.home')}
              </a>
            </Link>
            <Link href="/features">
              <a className={`text-sm ${isActive('/features') ? 'font-bold' : ''}`}>
                {t('navigation.features')}
              </a>
            </Link>
            <Link href="/about">
              <a className={`text-sm ${isActive('/about') ? 'font-bold' : ''}`}>
                {t('navigation.about')}
              </a>
            </Link>
            <Link href="/contact">
              <a className={`text-sm ${isActive('/contact') ? 'font-bold' : ''}`}>
                {t('navigation.contact')}
              </a>
            </Link>

            {isAuthenticated && (
              <Link href="/dashboard">
                <a className={`text-sm ${isActive('/dashboard') ? 'font-bold' : ''}`}>
                  {t('navigation.dashboard')}
                </a>
              </Link>
            )}

            {user?.role === 'admin' && (
              <Link href="/admin">
                <a className={`text-sm ${isActive('/admin') ? 'font-bold' : ''}`}>
                  {t('navigation.admin')}
                </a>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;