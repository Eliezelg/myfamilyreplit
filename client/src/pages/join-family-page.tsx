import { useState, useEffect } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Header from "../components/header";
import Footer from "../components/footer";

export default function JoinFamilyPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, params] = useRoute("/join-family");
  const [inviteCode, setInviteCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [familyName, setFamilyName] = useState("");
  
  // Extract token from URL query params (if any)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get("token");
    if (token) {
      setInviteCode(token);
    }
  }, []);
  
  // Mutation to join a family with an invitation code
  const joinFamilyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/join-family", {
        token: inviteCode
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setSuccess(true);
      setFamilyName(data.name || "המשפחה");
      toast({
        title: "הצטרפת בהצלחה!",
        description: `ברוך הבא למשפחת ${data.name || "המשפחה"}`,
      });
      // Redirect to home page after 3 seconds
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בהצטרפות למשפחה",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode) {
      toast({
        title: "שגיאה",
        description: "נא להזין קוד הזמנה",
        variant: "destructive",
      });
      return;
    }
    
    if (!user) {
      // Redirect to auth page with return URL
      window.location.href = `/auth?returnTo=${encodeURIComponent(`/join-family?token=${inviteCode}`)}`;
      return;
    }
    
    joinFamilyMutation.mutate();
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-neutral-light text-neutral-dark">
      <Header 
        onMobileMenuClick={() => {}} 
        user={user}
      />
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="max-w-md mx-auto">
          <Link href="/" className="inline-flex items-center text-primary mb-6 hover:underline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            חזרה לדף הבית
          </Link>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-center">הצטרף למשפחה</CardTitle>
              <CardDescription className="text-center">
                {success 
                  ? `הצטרפת בהצלחה למשפחת ${familyName}!` 
                  : "הזן את קוד ההזמנה כדי להצטרף למשפחה"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {success ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">הצטרפת בהצלחה!</h3>
                  <p className="text-gray-600 mb-4">אתה עכשיו חלק ממשפחת {familyName}</p>
                  <p className="text-sm text-gray-500">מעביר אותך לדף הבית...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="inviteCode">קוד הזמנה</Label>
                    <Input
                      id="inviteCode"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      placeholder="הזן את קוד ההזמנה"
                      className="text-left ltr"
                      dir="ltr"
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={joinFamilyMutation.isPending || !inviteCode}
                  >
                    {joinFamilyMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    הצטרף למשפחה
                  </Button>
                  
                  {!user && (
                    <div className="text-center mt-4 text-sm text-gray-600">
                      <p>יש להתחבר לחשבון כדי להצטרף למשפחה</p>
                    </div>
                  )}
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}