import { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Copy, Check, Link, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";

interface InviteFamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyId: number;
  familyName: string;
}

export default function InviteFamilyModal({ isOpen, onClose, familyId, familyName }: InviteFamilyModalProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"link" | "email">("link");
  const [email, setEmail] = useState("");
  const inviteLinkRef = useRef<HTMLInputElement>(null);
  
  // Fetch existing invitation for this family
  const { data: invitation, isLoading } = useQuery({
    queryKey: [`/api/families/${familyId}/invitation`],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/families/${familyId}/invitation`);
        return await res.json();
      } catch (error) {
        // If no invitation exists yet, that's fine
        return null;
      }
    },
    refetchOnWindowFocus: false,
  });
  
  // Create new invitation code
  const createInvitationMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/families/${familyId}/invitation`);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData([`/api/families/${familyId}/invitation`], data);
      toast({
        title: "קוד הזמנה נוצר בהצלחה",
        description: "כעת תוכל לשתף אותו עם בני משפחה",
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
  
  // Send email invitation
  const sendEmailInvitationMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("POST", `/api/families/${familyId}/invite-email`, { email });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "הזמנה נשלחה בהצלחה",
        description: `הזמנה נשלחה ל ${email}`,
      });
      setEmail("");
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בשליחת הזמנה",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const inviteCode = invitation?.token || "";
  const inviteLink = `${window.location.origin}/join-family?code=${inviteCode}`;
  
  const copyToClipboard = () => {
    if (inviteLinkRef.current) {
      inviteLinkRef.current.select();
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "הקישור הועתק ללוח",
        description: "כעת ניתן לשלוח אותו לבני משפחה",
      });
    }
  };
  
  const handleCreateInvite = () => {
    createInvitationMutation.mutate();
  };
  
  const handleSendEmail = () => {
    if (!email) {
      toast({
        title: "אימייל לא תקין",
        description: "אנא הזן כתובת אימייל",
        variant: "destructive",
      });
      return;
    }
    
    sendEmailInvitationMutation.mutate(email);
  };
  
  const showCreateButton = !invitation || !invitation.token;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">הזמן בני משפחה ל{familyName}</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "link" | "email")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link" className="flex items-center gap-2">
              <Link className="w-4 h-4" />
              <span>הזמנה באמצעות קישור</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>הזמנה באמצעות אימייל</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="link" className="py-4">
            {showCreateButton ? (
              <div className="text-center">
                <p className="mb-4 text-gray-600">צור קוד הזמנה ייחודי למשפחה שלך וכך תוכל להזמין אנשים להצטרף</p>
                <Button onClick={handleCreateInvite} disabled={createInvitationMutation.isPending}>
                  {createInvitationMutation.isPending ? "יוצר קוד..." : "צור קוד הזמנה"}
                </Button>
              </div>
            ) : (
              <div>
                <p className="mb-2 font-medium">קוד הזמנה:</p>
                <div className="flex items-center mb-4">
                  <code className="p-2 bg-gray-100 rounded text-lg flex-1 font-bold tracking-wide">
                    {invitation?.token}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mr-2"
                    onClick={() => {
                      navigator.clipboard.writeText(invitation?.token || "");
                      toast({
                        title: "הקוד הועתק ללוח",
                      });
                    }}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                
                <p className="mb-2 font-medium">קישור הזמנה:</p>
                <div className="flex items-center">
                  <Input
                    ref={inviteLinkRef}
                    readOnly
                    value={inviteLink}
                    className="flex-1 pl-2 font-mono text-xs"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mr-2"
                    onClick={copyToClipboard}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                
                <p className="mt-4 text-sm text-gray-500">
                  שלח את הקישור לבני משפחה שברצונך להזמין. הם יוכלו להשתמש בקישור או להכניס את קוד ההזמנה ישירות באתר.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="email" className="py-4">
            <div>
              <p className="mb-4 text-gray-600">שלח הזמנה באמצעות דוא"ל לבני משפחה להצטרף למשפחה שלך</p>
              
              <div className="mb-4">
                <label htmlFor="email" className="block mb-2 font-medium">אימייל:</label>
                <Input
                  id="email"
                  type="email"
                  placeholder="הכנס כתובת אימייל"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={handleSendEmail}
                disabled={!email || sendEmailInvitationMutation.isPending}
                className="w-full"
              >
                {sendEmailInvitationMutation.isPending ? "שולח..." : "שלח הזמנה"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>סגור</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}