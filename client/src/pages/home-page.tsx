import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "../components/header";
import FamilyDashboard from "../components/family-dashboard";
import Footer from "../components/footer";
import MobileSidebar from "../components/mobile-sidebar";
import UploadModal from "../components/upload-modal";
import CreateFamilyForm from "../components/create-family-form";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Loader2, PlusCircle, UserPlus, ChevronDown, Home } from "lucide-react";
import { Family } from "@shared/schema";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HomePage() {
  const { user } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAddFamilyModalOpen, setIsAddFamilyModalOpen] = useState(false);
  const [selectedFamilyId, setSelectedFamilyId] = useState<number | null>(null);
  
  // Query to get families for the current user
  const { data: families, isLoading, error } = useQuery<Family[]>({
    queryKey: ["/api/families"],
    enabled: !!user, // Only run query if user is logged in
  });
  
  // Get the active family, either selected or first in the list
  const activeFamily = selectedFamilyId
    ? families?.find(f => f.id === selectedFamilyId)
    : families?.[0];

  const handleFamilySelect = (familyId: number) => {
    setSelectedFamilyId(familyId);
  };

  const handleAddFamilySuccess = () => {
    setIsAddFamilyModalOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-light text-neutral-dark">
      <Header 
        onMobileMenuClick={() => setIsMobileSidebarOpen(true)} 
        user={user}
      />
      
      <main className="container mx-auto px-4 py-6 flex-grow">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center p-6 bg-red-50 rounded-lg">
            <p className="text-red-600">שגיאה בטעינת נתוני המשפחה</p>
            <p className="text-sm text-red-500">{error.message}</p>
          </div>
        ) : !families || families.length === 0 ? (
          // User has no families yet, show create form and join option
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold">ברוך הבא ל-MyFamily</h1>
              <p className="text-gray-600">צור משפחה חדשה או הצטרף למשפחה קיימת</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">צור משפחה חדשה</h2>
                <p className="text-gray-600 mb-4">צור משפחה חדשה ותזמין את בני המשפחה להצטרף</p>
                <CreateFamilyForm onSuccess={() => {}} />
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">הצטרף למשפחה קיימת</h2>
                <p className="text-gray-600 mb-6">יש לך קוד הזמנה? הצטרף למשפחה קיימת</p>
                <div className="text-center">
                  <a href="/join-family" className="inline-flex items-center justify-center bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
                    הצטרף עם קוד הזמנה
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // User has families
          <div>
            {/* Family Selector and Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div className="flex items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      <span className="font-medium">{activeFamily?.name || "בחר משפחה"}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    {families?.map((family) => (
                      <DropdownMenuItem 
                        key={family.id}
                        onClick={() => handleFamilySelect(family.id)}
                        className={family.id === activeFamily?.id ? "bg-gray-100" : ""}
                      >
                        {family.name}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsAddFamilyModalOpen(true)}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      הוסף משפחה חדשה
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsAddFamilyModalOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  צור משפחה
                </Button>
                <Link href="/join-family">
                  <Button variant="outline">
                    <UserPlus className="mr-2 h-4 w-4" />
                    הצטרף למשפחה
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Dashboard for the selected family */}
            {activeFamily && (
              <React.Suspense fallback={
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              }>
                <FamilyDashboard 
                  familyId={activeFamily.id}
                  familyName={activeFamily.name}
                  onUploadClick={() => setIsUploadModalOpen(true)}
                />
              </React.Suspense>
            )}
          </div>
        )}
      </main>
      
      <Footer />
      
      <MobileSidebar 
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        user={user}
        onFamilySelect={handleFamilySelect}
        onAddFamilyClick={() => setIsAddFamilyModalOpen(true)}
      />
      
      {/* Upload Modal */}
      {activeFamily && (
        <UploadModal 
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          familyId={activeFamily.id}
        />
      )}
      
      {/* Add Family Modal */}
      <Dialog open={isAddFamilyModalOpen} onOpenChange={setIsAddFamilyModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">הוספת משפחה</DialogTitle>
            <DialogDescription>
              צור משפחה חדשה או הצטרף למשפחה קיימת
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">צור משפחה חדשה</TabsTrigger>
              <TabsTrigger value="join">הצטרף למשפחה קיימת</TabsTrigger>
            </TabsList>
            
            <TabsContent value="create" className="mt-6">
              <CreateFamilyForm onSuccess={handleAddFamilySuccess} />
            </TabsContent>
            
            <TabsContent value="join" className="mt-6">
              <div className="text-center py-4">
                <h3 className="text-lg font-medium mb-4">הזן קוד הזמנה שקיבלת</h3>
                <p className="text-gray-600 mb-6">
                  יש לך קוד הזמנה? הצטרף למשפחה קיימת
                </p>
                <Link href="/join-family">
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    המשך להצטרפות
                  </Button>
                </Link>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddFamilyModalOpen(false)}>
              סגור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
