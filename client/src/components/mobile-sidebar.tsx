import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User, Family } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { 
  X, 
  Home, 
  Newspaper, 
  Image, 
  Settings, 
  Users, 
  Bell, 
  PlusCircle, 
  UserPlus, 
  User as UserIcon,
  LogOut,
  Calendar,
  CreditCard,
  Menu,
  ChevronRight
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    <div className="fixed inset-0 bg-black/50 z-50 flex">
      <div className="absolute inset-y-0 right-0 w-72 bg-background shadow-xl flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
              M
            </div>
            <h1 className="text-xl font-bold">MyFamily</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* User Info */}
        {user && (
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border">
                <AvatarImage src={user.profileImage || ""} alt={user.username} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user.firstName?.charAt(0) || user.username?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </div>
        )}
        
        <ScrollArea className="flex-1 p-4">
          {/* Main Navigation */}
          <div className="space-y-1 mb-6">
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/profile">
                <UserIcon className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/photos">
                <Image className="mr-2 h-4 w-4" />
                Photos
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/events">
                <Calendar className="mr-2 h-4 w-4" />
                Events
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/gazettes">
                <Newspaper className="mr-2 h-4 w-4" />
                Gazettes
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/fund">
                <CreditCard className="mr-2 h-4 w-4" />
                Family Fund
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/members">
                <Users className="mr-2 h-4 w-4" />
                Members
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/notifications">
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </Button>
          </div>
          
          <Separator className="my-4" />
          
          {/* Families Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">MY FAMILIES</h3>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onAddFamilyClick}>
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-1">
              {families?.map((family) => (
                <Button
                  key={family.id}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    if (onFamilySelect) {
                      onFamilySelect(family.id);
                      onClose();
                    }
                  }}
                >
                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                    {family.imageUrl ? (
                      <img src={family.imageUrl} alt={family.name} className="h-5 w-5 rounded-full" />
                    ) : (
                      <Home className="h-3 w-3 text-primary" />
                    )}
                  </div>
                  <span className="truncate">{family.name}</span>
                </Button>
              ))}
              
              <Button variant="outline" size="sm" className="w-full mt-2" onClick={onAddFamilyClick}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Family
              </Button>
              
              <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                <Link href="/join-family">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Join Family
                </Link>
              </Button>
            </div>
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => {
              logoutMutation.mutate();
              onClose();
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}