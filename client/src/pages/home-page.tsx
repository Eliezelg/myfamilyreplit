import { useState } from "react";
import Header from "../components/header";
import FamilyDashboard from "../components/family-dashboard";
import Footer from "../components/footer";
import MobileSidebar from "../components/mobile-sidebar";
import UploadModal from "../components/upload-modal";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { user } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  // Mock data for initial state - will be replaced with real data from API
  const initialFamilyId = 1;
  const initialFamilyName = "משפחת לוי";

  return (
    <div className="min-h-screen flex flex-col bg-neutral-light text-neutral-dark">
      <Header 
        onMobileMenuClick={() => setIsMobileSidebarOpen(true)} 
        user={user}
      />
      
      <main className="container mx-auto px-4 py-6 flex-grow">
        <FamilyDashboard 
          familyId={initialFamilyId}
          familyName={initialFamilyName}
          onUploadClick={() => setIsUploadModalOpen(true)}
        />
      </main>
      
      <Footer />
      
      <MobileSidebar 
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        user={user}
      />
      
      <UploadModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        familyId={initialFamilyId}
      />
    </div>
  );
}
