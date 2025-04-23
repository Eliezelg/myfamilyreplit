import { ReactNode } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
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
      <HeaderNav />
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
                    <Link href={item.href}>
                      <NavigationMenuLink className={cn(
                        navigationMenuTriggerStyle(),
                        "text-foreground hover:text-primary transition-colors duration-200"
                      )}>
                        {item.name}
                      </NavigationMenuLink>
                    </Link>
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
              <h2 className="font-bold text-xl text-primary">MyFamily</h2>
            </div>
            <p className="text-muted-foreground">
              Créez des liens durables entre les générations avec notre plateforme familiale innovante.
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
            <h3 className="font-medium text-base mb-4">Liens rapides</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/features">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    Fonctionnalités
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/about">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    À propos
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    Contact
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-medium text-base mb-4">Légal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    Politique de confidentialité
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/terms">
                  <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    Conditions d'utilisation
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-medium text-base mb-4">Contact</h3>
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
            © {currentYear} MyFamily. Tous droits réservés.
          </p>
          <p className="text-sm text-muted-foreground flex items-center">
            Conçu avec <Heart className="h-4 w-4 mx-1 text-red-500" /> pour toutes les familles
          </p>
        </div>
      </div>
    </footer>
  );
}