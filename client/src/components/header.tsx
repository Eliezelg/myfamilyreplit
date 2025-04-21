import { useState } from "react";
import { Link } from "wouter";
import { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { ChevronDown } from "lucide-react";

interface HeaderProps {
  onMobileMenuClick: () => void;
  user: User | null;
}

export default function Header({ onMobileMenuClick, user }: HeaderProps) {
  const { logoutMutation } = useAuth();
  
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl">
            מ
          </div>
          <h1 className="text-2xl font-bold text-primary">MyFamily</h1>
        </div>
        
        <div className="hidden md:flex items-center gap-6">
          <nav>
            <ul className="flex gap-6 font-medium">
              <li><Link href="/" className="text-primary hover:text-primary-dark transition">בית</Link></li>
              <li><Link href="#" className="hover:text-primary transition">הגזטה שלי</Link></li>
              <li><Link href="#" className="hover:text-primary transition">התמונות שלי</Link></li>
              <li><Link href="#" className="hover:text-primary transition">הגדרות</Link></li>
            </ul>
          </nav>
          
          {/* User Menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <span>שלום, {user.fullName.split(' ')[0]}</span>
                  <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden">
                    {user.profileImage ? (
                      <img 
                        src={user.profileImage} 
                        alt="תמונת פרופיל" 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-primary text-white font-bold">
                        {user.fullName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>החשבון שלי</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">פרופיל</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>הגדרות</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                  התנתק
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        {/* Mobile Menu Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden" 
          onClick={onMobileMenuClick}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </Button>
      </div>
    </header>
  );
}
