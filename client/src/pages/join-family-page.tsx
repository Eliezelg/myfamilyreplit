import { useState, useEffect } from "react";
import { useLocation, useRoute, useSearch, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Check } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function JoinFamilyPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const codeFromUrl = params.get("code") || "";
  const [code, setCode] = useState(codeFromUrl);
  const [success, setSuccess] = useState(false);
  const [familyName, setFamilyName] = useState("");

  // Check if the code is valid and get family info
  const validateCodeMutation = useMutation({
    mutationFn: async (inviteCode: string) => {
      const res = await apiRequest("GET", `/api/invitations/${inviteCode}/validate`);
      return await res.json();
    },
    onSuccess: (data) => {
      setFamilyName(data.familyName);
    },
    onError: () => {
      // Don't show an error - it will be shown when they try to join
    },
  });

  // Join family mutation
  const joinFamilyMutation = useMutation({
    mutationFn: async (inviteCode: string) => {
      const res = await apiRequest("POST", `/api/invitations/${inviteCode}/join`);
      return await res.json();
    },
    onSuccess: (data) => {
      setSuccess(true);
      setFamilyName(data.familyName);
      queryClient.invalidateQueries({ queryKey: ["/api/families"] });
      toast({
        title: "הצטרפת בהצלחה למשפחה",
        description: `כעת אתה חבר במשפחת ${data.familyName}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בהצטרפות למשפחה",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (code) {
      validateCodeMutation.mutate(code);
    }
  }, [code]);

  const handleJoinFamily = () => {
    if (!code) {
      toast({
        title: "קוד הזמנה חסר",
        description: "אנא הכנס קוד הזמנה",
        variant: "destructive",
      });
      return;
    }

    joinFamilyMutation.mutate(code);
  };

  if (!user) {
    return (
      <div className="container max-w-lg py-10">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-center">הצטרפות למשפחה</CardTitle>
            <CardDescription className="text-center">
              עליך להתחבר תחילה כדי להצטרף למשפחה
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <Alert>
              <AlertTitle>אינך מחובר</AlertTitle>
              <AlertDescription>
                עליך להתחבר או להירשם תחילה לפני שתוכל להצטרף למשפחה
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/auth">
              <Button>התחבר / הירשם</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-lg py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center">הצטרפות למשפחה</CardTitle>
          <CardDescription className="text-center">
            {success 
              ? `הצטרפת בהצלחה למשפחת ${familyName}`
              : "הזן את קוד ההזמנה כדי להצטרף למשפחה"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {success ? (
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 mb-4 flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-lg mb-2">הצטרפת בהצלחה!</p>
              <p className="text-gray-500 mb-6">
                כעת תוכל לצפות בתמונות, לעדכן אירועים ולהשתתף בפעילות המשפחתית.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label htmlFor="invite-code" className="block text-sm font-medium">
                  קוד הזמנה
                </label>
                <Input
                  id="invite-code"
                  placeholder="הכנס את קוד ההזמנה"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="font-mono"
                />
              </div>
              
              {familyName && (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertTitle>משפחה: {familyName}</AlertTitle>
                  <AlertDescription>
                    אתה עומד להצטרף למשפחה זו. לחץ על כפתור ההצטרפות למטה כדי להמשיך.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Link href={success ? "/families" : "/"}>
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              {success ? "לדף המשפחות" : "חזרה"}
            </Button>
          </Link>
          
          {!success && (
            <Button 
              onClick={handleJoinFamily}
              disabled={!code || joinFamilyMutation.isPending}
            >
              {joinFamilyMutation.isPending ? "מצטרף..." : "הצטרף למשפחה"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}