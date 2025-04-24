import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User, Family } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { X, Home, Newspaper, Image, Settings, Users, Bell, PlusCircle, UserPlus, User as UserIcon } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onFamilySelect?: (familyId: number) => void;
  onAddFamilyClick?: () => void;
}

export default function MobileSidebar({ 
  isOpen, 
  onClose, 
  user, 
  onFamilySelect, 
  onAddFamilyClick 
}: MobileSidebarProps) {
  const { logoutMutation } = useAuth();
  const [location, navigate] = useLocation();
  
  // Query to get families for the current user
  const { data: families } = useQuery<Family[]>({
    queryKey: ["/api/families"],
    enabled: !!user, // Only run query if user is logged in
  });
  
  if (!isOpen) return null;
  
  return (
    <div className="md:hidden fixed inset-0 bg-black bg-opacity-30 z-40 flex">
      <div className="absolute inset-y-0 right-0 w-72 bg-white shadow-lg py-4 px-3 overflow-y-auto">
        <div className="flex justify-between items-center mb-6 px-3">
          <h3 className="text-lg font-bold">תפריט</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
        </div>
        
        {/* User Info */}
        {user && (
          <div className="px-3 py-2 mb-6 flex items-center gap-3 border-b border-neutral-200 pb-4">
            <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden">
              {user.profileImage ? (
                <img 
                  src={user.profileImage} 
                  alt="תמונת פרופיל" 
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-primary text-white font-bold">
                  {user.firstName?.charAt(0) || ''}{user.lastName?.charAt(0) || ''}
                </div>
              )}
            </div>
            <div>
              <p className="font-medium">{user.firstName} {user.lastName}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
        )}
        
        {/* Families Section */}
        {families && families.length > 0 && (
          <div className="mb-4">
            <Accordion type="single" collapsible className="w-full" defaultValue="families">
              <AccordionItem value="families" className="border-none">
                <AccordionTrigger className="py-2 px-3 hover:bg-gray-50 rounded-md">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5" />
                    <span>המשפחות שלי</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pr-5 pl-2 pb-2 space-y-1">
                    {families.map((family) => (
                      <Link 
                        key={family.id} 
                        href="/"
                        onClick={(e) => {
                          e.preventDefault();
                          if (onFamilySelect) {
                            onFamilySelect(family.id);
                          }
                          onClose();
                        }}
                        className="block py-2 px-3 text-sm rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        {family.name}
                      </Link>
                    ))}
                    
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <Link 
                        href="/" 
                        onClick={(e) => {
                          e.preventDefault();
                          if (onAddFamilyClick) {
                            onAddFamilyClick();
                          }
                          onClose();
                        }}
                        className="flex items-center gap-2 py-2 px-3 text-sm text-primary rounded-md hover:bg-primary/5 transition-colors"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>צור משפחה חדשה</span>
                      </Link>
                      
                      <Link 
                        href="/join-family" 
                        onClick={(e) => {
                          onClose();
                        }}
                        className="flex items-center gap-2 py-2 px-3 text-sm text-primary rounded-md hover:bg-primary/5 transition-colors"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>הצטרף למשפחה</span>
                      </Link>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
        
        {/* Mobile Nav */}
        <nav>
          <ul className="space-y-2">
            <li>
              <Link 
                href="/" 
                onClick={() => onClose()}
                className="flex items-center gap-3 px-3 py-2 text-primary rounded-md bg-primary bg-opacity-10"
              >
                <Home className="w-5 h-5" />
                בית
              </Link>
            </li>
            <li>
              <Link 
                href="/gazette" 
                onClick={() => onClose()} 
                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-md"
              >
                <Newspaper className="w-5 h-5" />
                הגזטה שלי
              </Link>
            </li>
            <li>
              <Link 
                href="/photos" 
                onClick={() => onClose()}
                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-md"
              >
                <Image className="w-5 h-5" />
                התמונות שלי
              </Link>
            </li>
            <li>
              <Link 
                href="/family-management" 
                onClick={() => onClose()}
                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-md"
              >
                <Users className="w-5 h-5" />
                ניהול משפחה
              </Link>
            </li>
            <li>
              <Link 
                href="/notifications" 
                onClick={() => onClose()}
                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-md"
              >
                <Bell className="w-5 h-5" />
                התראות
              </Link>
            </li>
            <li>
              <Link 
                href="/profile" 
                onClick={() => onClose()}
                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-md"
              >
                <UserIcon className="w-5 h-5" />
                פרופיל
              </Link>
            </li>
            <li>
              <Link 
                href="/settings" 
                onClick={() => onClose()}
                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-md"
              >
                <Settings className="w-5 h-5" />
                הגדרות
              </Link>
            </li>
            <li>
              <Button 
                variant="ghost" 
                className="w-full justify-start px-3 py-2 hover:bg-gray-100 rounded-md"
                onClick={() => {
                  logoutMutation.mutate();
                  onClose();
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                התנתק
              </Button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
