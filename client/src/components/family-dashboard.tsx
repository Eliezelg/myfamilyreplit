import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Family, Photo, FamilyMember, Event, FamilyFund, FundTransaction, Recipient, User, Gazette } from "@shared/schema";
import { Calendar, Image, Users, CalendarIcon, PlusCircle, Eye, HelpCircle, Link, UserPlus, Download, RefreshCw, FileDown, Newspaper, Settings } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import InviteFamilyModal from "./invite-family-modal";
import { FamilyFundManager } from "./family-fund-manager";
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
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false);
  const [currentMonthYear, setCurrentMonthYear] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [isGeneratingGazette, setIsGeneratingGazette] = useState(false);
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const queryClientHook = useQueryClient();
  
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
    setIsGeneratingGazette(true);
    generateGazetteMutation.mutate(currentMonthYear);
  };
  
  // Family data query
  const { data: family } = useQuery<Family>({
    queryKey: [`/api/families/${familyId}`],
  });
  
  // Photos query for this family
  const { data: photos } = useQuery<Photo[]>({
    queryKey: [`/api/families/${familyId}/photos`],
  });
  
  // Members query for this family
  const { data: members } = useQuery<FamilyMemberWithUser[]>({
    queryKey: [`/api/families/${familyId}/members`],
  });
  
  // Fund query for this family
  const { data: fund, refetch: refetchFund } = useQuery<FamilyFund>({
    queryKey: [`/api/families/${familyId}/fund`],
  });
  
  // Transactions query for this family's fund
  const { data: transactions } = useQuery<FundTransaction[]>({
    queryKey: [`/api/families/${familyId}/fund/transactions`],
  });
  
  // Events query for this family
  const { data: events } = useQuery<Event[]>({
    queryKey: [`/api/families/${familyId}/events`],
  });
  
  // Recipients query for this family
  const { data: recipients } = useQuery<Recipient[]>({
    queryKey: [`/api/families/${familyId}/recipients`],
  });
  
  // Gazettes query for this family
  const { data: gazettes = [] } = useQuery<Gazette[]>({
    queryKey: [`/api/families/${familyId}/gazettes`],
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
  
  return (
    <>
      {/* Invite Family Modal */}
      <InviteFamilyModal 
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        familyId={familyId}
        familyName={familyName}
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
      
      {/* Family Selector */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold">ברוכים הבאים, {familyName}</h2>
            <p className="text-gray-600">הנה מה שקורה בגזטה המשפחתית שלך</p>
          </div>
          
          <div className="relative">
            <Button variant="outline" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white">
                מ
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
                <h3 className="text-xl font-bold">גזטה לחודש {getCurrentMonth()}</h3>
                <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">בהכנה</span>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-primary">
                    <CalendarIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">תאריך סגירה</p>
                    <p className="font-medium">31/08/2023</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                    <Image className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">תמונות שהועלו</p>
                    <p className="font-medium">{photos?.length || 0} / 28</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">תורמים החודש</p>
                    <p className="font-medium">{transactions?.length || 0} / {members?.length || 0} חברים</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                <Button className="gap-2" onClick={onUploadClick}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  העלה תמונות
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
                      מייצר גזטה...
                    </>
                  ) : (
                    <>
                      <Newspaper className="h-4 w-4" />
                      הפק גזטה לחודש {getCurrentMonth()}
                    </>
                  )}
                </Button>
                <Select
                  value={currentMonthYear}
                  onValueChange={setCurrentMonthYear}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="בחר חודש" />
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
                <h3 className="text-xl font-bold">תמונות אחרונות</h3>
                <Button variant="link" className="gap-1 p-0">
                  הצג הכל
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </Button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {photos && photos.length > 0 ? (
                  photos.slice(0, 4).map((photo) => (
                    <div key={photo.id} className="relative group aspect-square rounded-lg overflow-hidden bg-neutral-200">
                      <img 
                        src={photo.imageUrl} 
                        alt="תמונת משפחה" 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button size="icon" variant="ghost" className="bg-white hover:bg-white/90 text-black rounded-full transform transition-transform hover:scale-110">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500">אין תמונות להצגה, העלה את התמונות הראשונות שלך!</p>
                    <Button variant="outline" className="mt-4" onClick={onUploadClick}>
                      העלה תמונות
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
                <h3 className="text-xl font-bold">פעילות משפחתית</h3>
                <Button variant="link" className="gap-1 p-0">
                  הצג הכל
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
                        {/* Member image would be fetched from members data */}
                        <div className="h-full w-full flex items-center justify-center bg-primary text-white font-bold">
                          ל
                        </div>
                      </div>
                      <div>
                        <p className="font-medium">
                          {members?.find(m => m.userId === photo.userId)?.user?.username || "משתמש"}
                          <span className="font-normal text-gray-500"> העלה תמונה</span>
                        </p>
                        <p className="text-sm text-gray-500">{formatDate(photo.uploadedAt.toString())}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">אין פעילות להצגה</p>
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
                <h3 className="text-xl font-bold">קופת המשפחה</h3>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">מאוזן</span>
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-sm text-gray-500">יתרה נוכחית</span>
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
                  <span className="text-xs font-medium text-green-600">יתרה מספקת לגזטה הבאה</span>
                  <span className="text-xs text-gray-500">₪70</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3 mb-4">
                <Button 
                  className="gap-2" 
                  variant="secondary"
                  onClick={() => setIsAddFundsModalOpen(true)}
                >
                  <PlusCircle className="w-5 h-5" />
                  הוסף כסף
                </Button>
                <Button variant="outline" className="gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  היסטוריית תשלומים
                </Button>
              </div>
              
              <div className="border-t border-neutral-200 pt-4">
                <h4 className="font-medium mb-3">תורמים אחרונים</h4>
                <div className="space-y-3">
                  {transactions && transactions.length > 0 ? (
                    transactions.slice(0, 2).map((transaction) => (
                      <div key={transaction.id} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden">
                            {/* Member image would be fetched from members data */}
                            <div className="h-full w-full flex items-center justify-center bg-primary text-white font-bold">
                              ל
                            </div>
                          </div>
                          <span>{members?.find(m => m.userId === transaction.userId)?.user?.username || "משתמש"}</span>
                        </div>
                        <span className="font-medium text-green-600">
                          {formatCurrency(transaction.amount)}+
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-gray-500">אין תורמים להצגה</p>
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
                <h3 className="text-xl font-bold">חברי המשפחה</h3>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="gap-1"
                  onClick={() => setIsInviteModalOpen(true)}
                >
                  <UserPlus className="w-4 h-4" />
                  הזמן
                </Button>
              </div>
              
              <div className="space-y-3">
                {members && members.length > 0 ? (
                  members.slice(0, 4).map((member, index) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden">
                        {/* Member image would be fetched from users data */}
                        <div className="h-full w-full flex items-center justify-center bg-primary text-white font-bold">
                          ל
                        </div>
                      </div>
                      <div className="flex-grow">
                        <p className="font-medium">{member.user?.fullName || member.user?.username || "משתמש"}</p>
                        <p className="text-sm text-gray-500">{member.role === "admin" ? "מנהל" : "חבר"}</p>
                      </div>
                      <div className="flex items-center">
                        <span className={`w-3 h-3 ${index === 0 ? 'bg-green-500' : 'bg-gray-300'} rounded-full mr-1`}></span>
                        <span className="text-xs text-gray-500">{index === 0 ? 'מקוון' : 'לא מקוון'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">אין חברים להצגה</p>
                    <Button size="sm" className="mt-2">
                      הזמן חברי משפחה
                    </Button>
                  </div>
                )}
                
                <div className="mt-4 border-t border-neutral-200 pt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">מקבלי הגזטה</h4>
                    <Button variant="link" size="sm" className="p-0">נהל</Button>
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
                      <p className="text-xs mt-1 text-center text-gray-500">הוסף</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Available Gazettes */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold">גזטות זמינות</h3>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8"
                    title="הגדרות הגזטה"
                    onClick={() => navigate(`/families/${familyId}/gazette-settings`)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="link" className="gap-1 p-0">
                  הצג הכל
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
                          <span className="font-medium">גזטה {gazette.monthYear}</span>
                          <span className="text-xs text-gray-500">{photos?.length || 0} תמונות</span>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="gap-1"
                        onClick={() => window.open(`/api/families/${familyId}/gazettes/${gazette.id}/download`)}
                      >
                        <Download className="h-4 w-4" />
                        הורד
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">אין גזטות זמינות</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={handleGenerateGazette}
                      disabled={isGeneratingGazette}
                    >
                      {isGeneratingGazette ? 
                        <><RefreshCw className="h-4 w-4 animate-spin mr-2" /> מייצר גזטה...</> : 
                        <><Newspaper className="h-4 w-4 mr-2" /> יצירת גזטה</>
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
                <h3 className="text-xl font-bold">אירועים קרובים</h3>
                <Button variant="link" className="gap-1 p-0">
                  כל האירועים
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </Button>
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
                    <p className="text-gray-500">אין אירועים קרובים</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      הוסף אירוע
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
