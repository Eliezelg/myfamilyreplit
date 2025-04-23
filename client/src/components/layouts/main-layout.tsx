import { ReactNode } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import Header from "@/components/header";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { 
  Menu,
  X, 
  Heart,
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Mail, 
  Phone, 
  MapPin,
  ChevronDown, 
  Home, 
  Users, 
  Calendar, 
  Landmark, 
  BookOpen, 
  User, 
  LogOut 
} from "lucide-react";
import { useState } from "react";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <FooterSection />
    </div>
  );
}

function HeaderNav() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const navigation = [
    { name: "Accueil", href: "/" },
    { name: "Fonctionnalités", href: "/features" },
    { name: "À propos", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl">
                מ
              </div>
              <span className="font-bold text-2xl text-primary">MyFamily</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:ml-10 md:space-x-6">
            <NavigationMenu>
              <NavigationMenuList>
                {navigation.map((item) => (
                  <NavigationMenuItem key={item.name}>
                    <div
                      onClick={() => window.location.href = item.href}
                      className={cn(
                        navigationMenuTriggerStyle(),
                        "text-foreground hover:text-primary transition-colors duration-200 cursor-pointer"
                      )}
                    >
                      {item.name}
                    </div>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>

        {/* Auth buttons */}
        <div className="hidden md:flex gap-4 items-center">
          {user ? (
            <>
              <Link href="/profile">
                <Button variant="ghost" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Mon profil</span>
                </Button>
              </Link>
              <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                <span>Déconnexion</span>
              </Button>
              <Link href="/dashboard">
                <Button className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth">
                <Button variant="outline">Connexion</Button>
              </Link>
              <Link href="/auth?tab=register">
                <Button>Inscription</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden">
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80%] sm:w-[385px]">
              <SheetHeader className="mb-6">
                <SheetTitle>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg">
                      מ
                    </div>
                    <span className="font-bold text-xl text-primary">MyFamily</span>
                  </div>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col space-y-3">
                  {navigation.map((item) => (
                    <SheetClose asChild key={item.name}>
                      <Link href={item.href}>
                        <div className="flex items-center p-2 -mx-2 rounded-md hover:bg-muted cursor-pointer" onClick={() => setIsMenuOpen(false)}>
                          {item.name}
                        </div>
                      </Link>
                    </SheetClose>
                  ))}
                </div>
                <div className="border-t pt-4">
                  {user ? (
                    <div className="flex flex-col gap-2">
                      <SheetClose asChild>
                        <Link href="/profile">
                          <Button variant="outline" className="w-full justify-start text-left">
                            <User className="mr-2 h-4 w-4" />
                            Mon profil
                          </Button>
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link href="/dashboard">
                          <Button className="w-full justify-start text-left">
                            <Home className="mr-2 h-4 w-4" />
                            Dashboard
                          </Button>
                        </Link>
                      </SheetClose>
                      <Button 
                        variant="ghost" 
                        onClick={() => {
                          handleLogout();
                          setIsMenuOpen(false);
                        }}
                        className="w-full justify-start text-left"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Déconnexion
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <SheetClose asChild>
                        <Link href="/auth">
                          <Button variant="outline" className="w-full">
                            Connexion
                          </Button>
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link href="/auth?tab=register">
                          <Button className="w-full">
                            Inscription
                          </Button>
                        </Link>
                      </SheetClose>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function FooterSection() {
  const currentYear = new Date().getFullYear();
  const { t } = useTranslation('common');

  return (
    <footer className="bg-muted/20 border-t">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Logo and description */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-base">
                מ
              </div>
              <h2 className="font-bold text-xl text-primary">{t('app.name')}</h2>
            </div>
            <p className="text-muted-foreground">
              {t('app.tagline')}
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-medium text-base mb-4">{t('common.quickLinks')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/features">
                  <a className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    {t('navigation.features')}
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/about">
                  <a className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    {t('navigation.about')}
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <a className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    {t('navigation.contact')}
                  </a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-medium text-base mb-4">{t('common.legal')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy">
                  <a className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    {t('common.privacyPolicy')}
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/terms">
                  <a className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    {t('common.termsOfService')}
                  </a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-medium text-base mb-4">{t('navigation.contact')}</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">contact@myfamily.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">+33 1 23 45 67 89</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Paris, France</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} {t('app.name')}. {t('common.allRightsReserved')}
          </p>
          <p className="text-sm text-muted-foreground flex items-center">
            {t('common.designedWith')} <Heart className="h-4 w-4 mx-1 text-red-500" /> {t('common.forAllFamilies')}
          </p>
        </div>
      </div>
    </footer>
  );
}