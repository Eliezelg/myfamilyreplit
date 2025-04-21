import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Copy, Check, Link, Mail, RefreshCw } from "lucide-react";

interface InviteFamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyId: number;
  familyName: string;
}

export default function InviteFamilyModal({ isOpen, onClose, familyId, familyName }: InviteFamilyModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [activeTab, setActiveTab] = useState("code");
  const inviteCodeRef = useRef<HTMLInputElement>(null);
  
  // Query to get the family's invitation
  const { data: invitation, isLoading: isLoadingInvitation } = useQuery<{ id: number, familyId: number, token: string }>({
    queryKey: [`/api/families/${familyId}/invitation`],
    enabled: isOpen, // Only run the query when the modal is open
  });
  
  // Mutation to create a new invitation code
  const createInvitationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/families/${familyId}/invitation`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/families/${familyId}/invitation`] });
      toast({
        title: "הקוד נוצר בהצלחה",
        description: "קוד הזמנה חדש נוצר למשפחה שלך.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה ביצירת קוד הזמנה",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation to send email invitation
  const sendEmailInvitationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/families/${familyId}/invite-by-email`, {
        email: inviteEmail,
      });
      return await response.json();
    },
    onSuccess: () => {
      setInviteEmail("");
      toast({
        title: "הזמנה נשלחה",
        description: `הזמנה נשלחה בהצלחה ל-${inviteEmail}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בשליחת ההזמנה",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Function to copy invitation code to clipboard
  const copyInvitationCode = () => {
    if (invitation?.token && inviteCodeRef.current) {
      navigator.clipboard.writeText(invitation.token);
      setCopied(true);
      toast({
        title: "הקוד הועתק",
        description: "קוד ההזמנה הועתק ללוח.",
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  };
  
  // Function to generate a new invitation code
  const generateNewCode = () => {
    createInvitationMutation.mutate();
  };
  
  // Function to send email invitation
  const sendEmailInvitation = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteEmail) {
      sendEmailInvitationMutation.mutate();
    }
  };
  
  // Get full invitation URL
  const getInvitationUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/join-family?token=${invitation?.token}`;
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">הזמן חברי משפחה</DialogTitle>
          <DialogDescription className="text-center">
            הזמן את בני המשפחה להצטרף למשפחת "{familyName}"
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="code" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="code">הזמנה באמצעות קוד</TabsTrigger>
            <TabsTrigger value="email">הזמנה באמצעות אימייל</TabsTrigger>
          </TabsList>
          
          <TabsContent value="code" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invitation-code">קוד הזמנה</Label>
              <div className="flex">
                <Input
                  id="invitation-code"
                  ref={inviteCodeRef}
                  value={invitation?.token || ""}
                  readOnly
                  placeholder="טוען..."
                  className="flex-1 text-left ltr"
                  dir="ltr"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="mx-2"
                  onClick={copyInvitationCode}
                  disabled={!invitation?.token || isLoadingInvitation}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={generateNewCode}
                  disabled={createInvitationMutation.isPending}
                >
                  <RefreshCw className={`h-4 w-4 ${createInvitationMutation.isPending ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="invitation-link">קישור הזמנה</Label>
              <div className="flex">
                <Input
                  id="invitation-link"
                  value={invitation?.token ? getInvitationUrl() : ""}
                  readOnly
                  placeholder="טוען..."
                  className="flex-1 text-left ltr"
                  dir="ltr"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="mx-2"
                  onClick={() => {
                    navigator.clipboard.writeText(getInvitationUrl());
                    setCopied(true);
                    toast({
                      title: "הקישור הועתק",
                      description: "קישור ההזמנה הועתק ללוח.",
                    });
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  disabled={!invitation?.token || isLoadingInvitation}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Link className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm">
              <p>שלח את הקוד או את הקישור לבני המשפחה שלך כדי שיוכלו להצטרף למשפחה שלך.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="email" className="space-y-4">
            <form onSubmit={sendEmailInvitation}>
              <div className="space-y-2">
                <Label htmlFor="email">כתובת אימייל</Label>
                <div className="flex">
                  <Input
                    id="email"
                    type="email"
                    placeholder="הזן כתובת אימייל"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1 text-left ltr"
                    dir="ltr"
                    required
                  />
                  <Button
                    type="submit"
                    variant="default"
                    className="mx-2"
                    disabled={!inviteEmail || sendEmailInvitationMutation.isPending}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    שלח הזמנה
                  </Button>
                </div>
              </div>
              
              <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm mt-4">
                <p>הזמנה תישלח לכתובת האימייל שהזנת.</p>
              </div>
            </form>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="sm:justify-center mt-4">
          <Button variant="outline" onClick={onClose}>
            סגור
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}