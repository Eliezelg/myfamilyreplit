import { useState } from "react";
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
  ChevronDown, 
  Home, 
  Users, 
  Heart, 
  CalendarDays, 
  Landmark, 
  BookOpen, 
  User, 
  LogOut,
  Bell
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const navigation = [
    { name: "Accueil", href: "/" },
    { name: "Fonctionnalités", href: "/features" },
    { name: "Tarifs", href: "/pricing" },
    { name: "À propos", href: "/about" },
    { name: "Témoignages", href: "/testimonials" },
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
              <Link href="/notification-preferences">
                <Button variant="ghost" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <span>Notifications</span>
                </Button>
              </Link>
              <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                <span>Déconnexion</span>
              </Button>
              <Link href="/">
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
                    <div className="space-y-3">
                      <SheetClose asChild>
                        <Link href="/profile">
                          <div className="flex items-center p-2 -mx-2 rounded-md hover:bg-muted cursor-pointer">
                            <User className="h-5 w-5 mr-2" />
                            <span>Mon profil</span>
                          </div>
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link href="/notification-preferences">
                          <div className="flex items-center p-2 -mx-2 rounded-md hover:bg-muted cursor-pointer">
                            <Bell className="h-5 w-5 mr-2" />
                            <span>Préférences de notification</span>
                          </div>
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link href="/">
                          <div className="flex items-center p-2 -mx-2 rounded-md hover:bg-muted cursor-pointer">
                            <Home className="h-5 w-5 mr-2" />
                            <span>Dashboard</span>
                          </div>
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