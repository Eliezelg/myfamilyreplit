import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "../components/header";
import FamilyDashboard from "../components/family-dashboard";
import Footer from "../components/footer";
import MobileSidebar from "../components/mobile-sidebar";
import UploadModal from "../components/upload-modal";
import CreateFamilyForm from "../components/create-family-form";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Family } from "@shared/schema";

export default function HomePage() {
  const { user } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
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
          // User has no families yet, show create form
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold">ברוך הבא ל-MyFamily</h1>
              <p className="text-gray-600">התחל ליצור את הגזטה המשפחתית הראשונה שלך</p>
            </div>
            <CreateFamilyForm onSuccess={() => {}} />
          </div>
        ) : (
          // User has families, show the dashboard
          <FamilyDashboard 
            familyId={activeFamily?.id || 0}
            familyName={activeFamily?.name || ""}
            onUploadClick={() => setIsUploadModalOpen(true)}
          />
        )}
      </main>
      
      <Footer />
      
      <MobileSidebar 
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        user={user}
      />
      
      {activeFamily && (
        <UploadModal 
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          familyId={activeFamily.id}
        />
      )}
    </div>
  );
}
