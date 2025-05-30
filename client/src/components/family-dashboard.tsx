import { useState, useEffect, useCallback, useTransition } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Family, Photo, FamilyMember, Event, FamilyFund, FundTransaction, Recipient, User, Gazette } from "@shared/schema";
import { 
  Calendar, 
  Image, 
  Users, 
  CalendarIcon, 
  PlusCircle, 
  Eye, 
  Link, 
  UserPlus, 
  Download, 
  RefreshCw, 
  FileDown, 
  Newspaper, 
  Settings, 
  Plus,
  ArrowRight,
  BarChart,
  Wallet,
  Clock,
  ChevronRight,
  MoreHorizontal,
  Loader2
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import InviteFamilyModal from "./invite-family-modal";
import { FamilyFundManager } from "./family-fund-manager";
import AddEventForm from "./add-event-form";
import PhotoViewerModal from "./photo-viewer-modal";
import PhotosViewerModal from "./photos-viewer-modal";
import EventsViewerModal from "./events-viewer-modal";
import FamilyEmailSettings from "./family-email-settings";
import { format, parse } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

// Type étendu pour inclure les données utilisateur
interface FamilyMemberWithUser extends FamilyMember {
  user?: User;
}

interface FamilyDashboardProps {
  familyId: number;
  familyName: string;
  onUploadClick: () => void;
}

export default function FamilyDashboard({ familyId, familyName, onUploadClick }: FamilyDashboardProps) {
  const { t } = useTranslation('dashboard');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [isEventsViewerOpen, setIsEventsViewerOpen] = useState(false);
  const [isPhotosViewerOpen, setIsPhotosViewerOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [currentMonthYear, setCurrentMonthYear] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [isGeneratingGazette, setIsGeneratingGazette] = useState(false);
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const queryClientHook = useQueryClient();
  const [isPending, startTransition] = useTransition();
  
  // Fonction pour rafraîchir les données du fonds
  const refreshFundData = useCallback(() => {
    queryClientHook.invalidateQueries({ queryKey: [`/api/families/${familyId}/fund`] });
    queryClientHook.invalidateQueries({ queryKey: [`/api/families/${familyId}/fund/transactions`] });
  }, [familyId, queryClientHook]);
  
  // Effet pour rafraîchir les données au retour de la modale
  useEffect(() => {
    if (!isAddFundsModalOpen) {
      // Rafraîchit les données après la fermeture de la modale
      refreshFundData();
    }
  }, [isAddFundsModalOpen, refreshFundData]);
  
  // Effet pour rafraîchir les événements après la fermeture de la modale
  useEffect(() => {
    if (!isAddEventModalOpen) {
      // Rafraîchir les données d'événements
      queryClientHook.invalidateQueries({ queryKey: [`/api/families/${familyId}/events`] });
    }
  }, [isAddEventModalOpen, familyId, queryClientHook]);
  
  // Mutation pour générer une gazette
  const generateGazetteMutation = useMutation({
    mutationFn: async (monthYear: string) => {
      const response = await apiRequest('POST', `/api/families/${familyId}/gazettes/generate`, { monthYear });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to generate gazette");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Gazette générée avec succès",
        description: "La gazette a été générée et est maintenant disponible",
        variant: "default",
      });
      setIsGeneratingGazette(false);
      // Invalider la requête des gazettes pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: [`/api/families/${familyId}/gazettes`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur lors de la génération",
        description: error.message || "Une erreur est survenue lors de la génération de la gazette",
        variant: "destructive",
      });
      setIsGeneratingGazette(false);
    }
  });
  
  // Fonction pour gérer la génération d'une gazette
  const handleGenerateGazette = () => {
    startTransition(() => {
      setIsGeneratingGazette(true);
      generateGazetteMutation.mutate(currentMonthYear);
    });
  };
  
  // Family data query - to fix suspension issues, wrap with useTransition for all state updates
  const { data: family, isLoading: familyLoading } = useQuery<Family>({
    queryKey: [`/api/families/${familyId}`],
    enabled: !!familyId && !isPending,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });
  
  // Photos query for this family
  const { data: photos, isLoading: photosLoading } = useQuery<Photo[]>({
    queryKey: [`/api/families/${familyId}/photos`],
    enabled: !!familyId && !isPending,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1
  });
  
  // Members query for this family
  const { data: members, isLoading: membersLoading } = useQuery<FamilyMemberWithUser[]>({
    queryKey: [`/api/families/${familyId}/members`],
    enabled: !!familyId && !isPending,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1
  });
  
  // Fund query for this family
  const { data: fund, refetch: refetchFund, isLoading: fundLoading } = useQuery<FamilyFund>({
    queryKey: [`/api/families/${familyId}/fund`],
    enabled: !!familyId && !isPending,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    retry: 1
  });
  
  // Transactions query for this family's fund
  const { data: transactions, isLoading: transactionsLoading } = useQuery<FundTransaction[]>({
    queryKey: [`/api/families/${familyId}/fund/transactions`],
    enabled: !!familyId && !isPending,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    retry: 1
  });
  
  // Events query for this family
  const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: [`/api/families/${familyId}/events`],
    enabled: !!familyId && !isPending,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1
  });
  
  // Recipients query for this family
  const { data: recipients, isLoading: recipientsLoading } = useQuery<Recipient[]>({
    queryKey: [`/api/families/${familyId}/recipients`],
    enabled: !!familyId && !isPending,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1
  });
  
  // Gazettes query for this family
  const { data: gazettes = [], isLoading: gazettesLoading } = useQuery<Gazette[]>({
    queryKey: [`/api/families/${familyId}/gazettes`],
    enabled: !!familyId && !isPending,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1
  });

  // Helper function to format date
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return new Intl.DateTimeFormat("he-IL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };
  
  // Helper function to get current month's gazette
  const getCurrentMonth = () => {
    const now = new Date();
    return new Intl.DateTimeFormat("he-IL", { month: "long" }).format(now);
  };
  
  // Helper function to format currency
  const formatCurrency = (amount: number, currency: string = "ILS") => {
    const formatter = new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    });
    return formatter.format(amount / 100); // Convert from cents to actual currency
  };
  
  // Vérifier si l'utilisateur actuel est administrateur de la famille
  // Note: nous utilisons le premier membre admin pour le moment comme exemple
  // Dans une implémentation réelle, il faudrait obtenir l'ID de l'utilisateur connecté
  const isAdmin = members?.some(member => member.role === "admin") || false;

  // Indicateur de chargement global
  const isAnyLoading = familyLoading || photosLoading || membersLoading || fundLoading || 
                        transactionsLoading || eventsLoading || recipientsLoading || gazettesLoading || isPending;

  // Affichage d'un état de chargement pendant les transitions
  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      {/* Invite Family Modal */}
      <InviteFamilyModal 
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        familyId={familyId}
        familyName={familyName}
      />
      
      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <PhotoViewerModal
          photo={selectedPhoto}
          user={members?.find(m => m.userId === selectedPhoto.userId)?.user}
          isOpen={isPhotoModalOpen}
          onClose={() => {
            setIsPhotoModalOpen(false);
            startTransition(() => {
              setTimeout(() => setSelectedPhoto(null), 300);
            });
          }}
        />
      )}
      
      {/* Photos Gallery Modal */}
      <PhotosViewerModal
        photos={photos || []}
        members={members}
        familyId={familyId}
        isOpen={isPhotosViewerOpen}
        onClose={() => setIsPhotosViewerOpen(false)}
        onUploadClick={onUploadClick}
      />
      
      {/* Events Viewer Modal */}
      <EventsViewerModal
        events={events || []}
        members={members}
        familyId={familyId}
        isOpen={isEventsViewerOpen}
        onClose={() => setIsEventsViewerOpen(false)}
        onAddEvent={() => {
          setIsEventsViewerOpen(false);
          startTransition(() => {
            setTimeout(() => setIsAddEventModalOpen(true), 300);
          });
        }}
      />
      
      {/* Add Funds Modal */}
      {isAddFundsModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">הוספת כסף לקופה המשפחתית</h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsAddFundsModalOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
              <FamilyFundManager familyId={familyId} />
            </div>
          </div>
        </div>
      )}
      
      {/* Add Event Modal */}
      {isAddEventModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">הוספת אירוע חדש</h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsAddEventModalOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
              
              <AddEventForm 
                familyId={familyId} 
                onClose={() => setIsAddEventModalOpen(false)} 
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Family Selector */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold">{t('welcome', { familyName })}</h2>
            <p className="text-gray-600">{t('overview')}</p>
          </div>
          
          <div className="relative">
            <Button variant="outline" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white">
                {familyName.charAt(0)}
              </div>
              <span>{familyName}</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Family Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Gazette Status */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">{t('gazette.title', { month: getCurrentMonth() })}</h3>
                <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">{t('gazette.status')}</span>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-primary">
                    <CalendarIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('gazette.closingDate')}</p>
                    <p className="font-medium">31/08/2023</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                    <Image className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('gazette.uploadedPhotos')}</p>
                    <p className="font-medium">{photos?.length || 0} / 28</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('gazette.contributors')}</p>
                    <p className="font-medium">{transactions?.length || 0} {t('gazette.outOf')} {members?.length || 0} {t('gazette.members')}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                <Button className="gap-2" onClick={onUploadClick}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  {t('gazette.uploadPhotos')}
                </Button>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  disabled={isGeneratingGazette}
                  onClick={handleGenerateGazette}
                >
                  {isGeneratingGazette ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      {t('gazette.generating')}
                    </>
                  ) : (
                    <>
                      <Newspaper className="h-4 w-4" />
                      {t('gazette.generateGazette', { month: getCurrentMonth() })}
                    </>
                  )}
                </Button>
                <Select
                  value={currentMonthYear}
                  onValueChange={setCurrentMonthYear}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder={t('gazette.selectMonth')} />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 6 }, (_, index) => {
                      const date = new Date();
                      date.setMonth(date.getMonth() - index);
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const value = `${year}-${month}`;
                      return (
                        <SelectItem key={value} value={value}>
                          {format(date, 'MMMM yyyy', { locale: fr })}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Photos */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">{t('photos.recentPhotos')}</h3>
                <Button 
                  variant="link" 
                  className="gap-1 p-0"
                  onClick={() => setIsPhotosViewerOpen(true)}
                >
                  {t('photos.viewAll')}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </Button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {photos && photos.length > 0 ? (
                  photos.slice(0, 4).map((photo) => (
                    <div 
                      key={photo.id} 
                      className="relative group aspect-square rounded-lg overflow-hidden bg-neutral-200 cursor-pointer"
                      onClick={() => {
                        startTransition(() => {
                          setSelectedPhoto(photo);
                          setIsPhotoModalOpen(true);
                        });
                      }}
                    >
                      <img 
                        src={photo.imageUrl} 
                        alt="Family photo" 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="bg-white hover:bg-white/90 text-black rounded-full transform transition-transform hover:scale-110"
                          onClick={(e) => {
                            e.stopPropagation();
                            startTransition(() => {
                              setSelectedPhoto(photo);
                              setIsPhotoModalOpen(true);
                            });
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500">{t('photos.noPhotos')}</p>
                    <Button variant="outline" className="mt-4" onClick={onUploadClick}>
                      {t('gazette.uploadPhotos')}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Family Activity */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">{t('activity.title')}</h3>
                <Button 
                  variant="link" 
                  className="gap-1 p-0"
                  onClick={() => startTransition(() => setIsEventsViewerOpen(true))}
                >
                  {t('activity.viewEvents')}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </Button>
              </div>
              
              <div className="space-y-4">
                {photos && photos.length > 0 ? (
                  photos.slice(0, 3).map((photo) => (
                    <div key={photo.id} className="flex gap-3 border-b border-neutral-200 pb-4 last:border-b-0 last:pb-0">
                      <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden">
                        {members?.find(m => m.userId === photo.userId)?.user?.profileImage ? (
                          <img 
                            src={members?.find(m => m.userId === photo.userId)?.user?.profileImage || ""} 
                            alt={members?.find(m => m.userId === photo.userId)?.user?.username || "User"} 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-primary text-white font-bold">
                            {members?.find(m => m.userId === photo.userId)?.user?.username?.charAt(0).toUpperCase() || "U"}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {members?.find(m => m.userId === photo.userId)?.user?.username || "User"}
                          <span className="font-normal text-gray-500"> {t('photos.uploaded')}</span>
                        </p>
                        <p className="text-sm text-gray-500">{formatDate(photo.uploadedAt.toString())}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">{t('activity.noActivity')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column */}
        <div className="space-y-6">
          {/* Family Fund */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">{t('familyFund.title')}</h3>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">{t('familyFund.status')}</span>
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-sm text-gray-500">{t('familyFund.currentBalance')}</span>
                  <span className="text-2xl font-bold">{fund ? formatCurrency(fund.balance) : "₪0"}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-green-500 h-2.5 rounded-full" 
                    style={{ width: fund ? `${Math.min((fund.balance / 7000) * 100, 100)}%` : "0%" }}
                  ></div>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">₪0</span>
                  <span className="text-xs font-medium text-green-600">{t('familyFund.sufficientBalance')}</span>
                  <span className="text-xs text-gray-500">₪70</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3 mb-4">
                <Button 
                  className="gap-2" 
                  variant="secondary"
                  onClick={() => startTransition(() => setIsAddFundsModalOpen(true))}
                >
                  <PlusCircle className="w-5 h-5" />
                  {t('familyFund.addFunds')}
                </Button>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => navigate(`/families/${familyId}/fund/transactions`)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  {t('familyFund.viewAll')}
                </Button>
              </div>
              
              <div className="border-t border-neutral-200 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">{t('familyFund.recentTransactions')}</h4>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0"
                    onClick={() => navigate(`/families/${familyId}/fund/contributors`)}
                  >
                    {t('familyFund.viewAll')}
                  </Button>
                </div>
                <div className="space-y-3">
                  {transactions && transactions.length > 0 ? (
                    transactions.slice(0, 2).map((transaction) => (
                      <div key={transaction.id} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden">
                            {members?.find(m => m.userId === transaction.userId)?.user?.profileImage ? (
                              <img 
                                src={members?.find(m => m.userId === transaction.userId)?.user?.profileImage || ""} 
                                alt={members?.find(m => m.userId === transaction.userId)?.user?.username || "User"} 
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-primary text-white font-bold">
                                {members?.find(m => m.userId === transaction.userId)?.user?.username?.charAt(0).toUpperCase() || "U"}
                              </div>
                            )}
                          </div>
                          <span>{members?.find(m => m.userId === transaction.userId)?.user?.username || "User"}</span>
                        </div>
                        <span className="font-medium text-green-600">
                          {formatCurrency(transaction.amount)}+
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-gray-500">{t('familyFund.noTransactions')}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Family Members */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">{t('members.title')}</h3>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="gap-1"
                  onClick={() => startTransition(() => setIsInviteModalOpen(true))}
                >
                  <UserPlus className="w-4 h-4" />
                  {t('members.inviteMembers')}
                </Button>
              </div>
              
              <div className="space-y-3">
                {members && members.length > 0 ? (
                  members.slice(0, 4).map((member, index) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden">
                        {member.user?.profileImage ? (
                          <img 
                            src={member.user.profileImage} 
                            alt={member.user.username || "User"} 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-primary text-white font-bold">
                            {member.user?.username ? member.user.username.charAt(0).toUpperCase() : "U"}
                          </div>
                        )}
                      </div>
                      <div className="flex-grow">
                        <p className="font-medium">{(member.user?.firstName && member.user?.lastName) ? `${member.user.firstName} ${member.user.lastName}` : member.user?.username || "User"}</p>
                        <p className="text-sm text-gray-500">{member.role === "admin" ? "Admin" : "Member"}</p>
                      </div>
                      <div className="flex items-center">
                        <span className={`w-3 h-3 ${index === 0 ? 'bg-green-500' : 'bg-gray-300'} rounded-full mr-1`}></span>
                        <span className="text-xs text-gray-500">{index === 0 ? 'Online' : 'Offline'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">{t('members.noMembers')}</p>
                    <Button size="sm" className="mt-2">
                      {t('members.inviteMembers')}
                    </Button>
                  </div>
                )}
                
                <div className="mt-4 border-t border-neutral-200 pt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{t('familyFund.manageRecipients')}</h4>
                    <Button variant="link" size="sm" className="p-0">{t('familyFund.viewAll')}</Button>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {recipients && recipients.length > 0 ? (
                      recipients.slice(0, 2).map((recipient) => (
                        <div key={recipient.id} className="flex flex-col items-center">
                          <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden border-2 border-primary p-0.5">
                            {recipient.imageUrl ? (
                              <img src={recipient.imageUrl} alt={recipient.name} className="h-full w-full object-cover rounded-full" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-primary text-white font-bold rounded-full">
                                {recipient.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <p className="text-xs mt-1 text-center">{recipient.name}</p>
                        </div>
                      ))
                    ) : null}
                    
                    <div className="flex flex-col items-center">
                      <Button variant="outline" size="icon" className="h-12 w-12 rounded-full">
                        <PlusCircle className="h-6 w-6" />
                      </Button>
                      <p className="text-xs mt-1 text-center text-gray-500">Add</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Email Settings */}
          <FamilyEmailSettings familyId={familyId} isAdmin={isAdmin} />
          
          {/* Available Gazettes */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold">{t('gazette.title', { month: '' })}</h3>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8"
                    title={t('gazette.title')}
                    onClick={() => navigate(`/families/${familyId}/gazette-settings`)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
                <Button 
                  variant="link" 
                  className="gap-1 p-0"
                  onClick={() => navigate(`/families/${familyId}/gazettes`)}
                >
                  {t('photos.viewAll')}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </Button>
              </div>
              
              <div className="space-y-3">
                {gazettes.length > 0 ? (
                  gazettes.slice(0, 3).map((gazette: Gazette) => (
                    <div key={gazette.id} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 bg-blue-100 rounded-md flex items-center justify-center text-blue-600">
                          <FileDown className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">{t('gazette.title', { month: gazette.monthYear })}</span>
                          <span className="text-xs text-gray-500">{photos?.length || 0} {t('photos.recentPhotos')}</span>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="gap-1"
                        onClick={() => window.open(`/api/families/${familyId}/gazettes/${gazette.id}/download`)}
                      >
                        <Download className="h-4 w-4" />
                        {t('gazette.uploadPhotos')}
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">{t('gazette.noGazettes')}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={handleGenerateGazette}
                      disabled={isGeneratingGazette}
                    >
                      {isGeneratingGazette ? 
                        <><RefreshCw className="h-4 w-4 animate-spin mr-2" /> {t('gazette.generating')}</> : 
                        <><Newspaper className="h-4 w-4 mr-2" /> {t('gazette.generateGazette', { month: getCurrentMonth() })}</>
                      }
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Upcoming Events */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">{t('events.title')}</h3>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="gap-1"
                    onClick={() => startTransition(() => setIsAddEventModalOpen(true))}
                  >
                    <Plus className="h-4 w-4" />
                    {t('events.addEvent')}
                  </Button>
                  <Button 
                    variant="link" 
                    className="gap-1 p-0"
                    onClick={() => startTransition(() => setIsEventsViewerOpen(true))}
                  >
                    {t('events.viewAll')}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3">
                {events && events.length > 0 ? (
                  events.slice(0, 3).map((event) => {
                    const eventDate = new Date(event.date);
                    const day = eventDate.getDate();
                    const month = new Intl.DateTimeFormat("he-IL", { month: "short" }).format(eventDate);
                    
                    return (
                      <div key={event.id} className="flex gap-3 items-start pb-3 border-b border-neutral-200 last:border-b-0 last:pb-0">
                        <div className="bg-blue-100 h-12 w-12 rounded-lg flex flex-col items-center justify-center">
                          <span className="text-primary font-bold text-sm">{day}</span>
                          <span className="text-primary text-xs">{month}</span>
                        </div>
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-gray-500">{event.description}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">{t('events.noEvents')}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => startTransition(() => setIsAddEventModalOpen(true))}
                    >
                      {t('events.addEvent')}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
