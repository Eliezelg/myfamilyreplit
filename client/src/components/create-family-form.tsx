import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertFamilySchema, Family } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, CreditCard, CheckCircle2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CreditCardForm } from "./credit-card-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

const createFamilySchema = insertFamilySchema.extend({
  name: z.string().min(2, "שם המשפחה חייב להכיל לפחות 2 תווים"),
});

type CreateFamilyFormValues = z.infer<typeof createFamilySchema>;

interface CreateFamilyFormProps {
  onSuccess?: () => void;
}

// Prix de l'abonnement en shekels (en agorot)
const SUBSCRIPTION_PRICE = 7000; // 70 shekels

export default function CreateFamilyForm({ onSuccess }: CreateFamilyFormProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'info' | 'payment' | 'processing' | 'success'>('info');
  const [cardToken, setCardToken] = useState<string | null>(null);
  const [familyData, setFamilyData] = useState<CreateFamilyFormValues | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [newFamily, setNewFamily] = useState<Family | null>(null);
  
  const form = useForm<CreateFamilyFormValues>({
    resolver: zodResolver(createFamilySchema),
    defaultValues: {
      name: "",
      imageUrl: "", // Ensure this is always a string, never null
    },
  });

  // Mutation pour traiter le paiement
  const processPaymentMutation = useMutation({
    mutationFn: async ({ familyId, token }: { familyId: number, token: string }) => {
      const response = await apiRequest("POST", "/api/payments/process-with-token", {
        familyId,
        amount: SUBSCRIPTION_PRICE,
        description: "דמי מנוי שנתי למשפחה",
        token
      });
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setPaymentSuccess(true);
        setStep('success');
        toast({
          title: "התשלום בוצע בהצלחה",
          description: "המנוי למשפחה הופעל בהצלחה",
        });
        // Invalider les requêtes pour recharger les données des familles
        queryClient.invalidateQueries({ queryKey: ["/api/families"] });
        if (onSuccess) setTimeout(onSuccess, 1500);
      } else {
        toast({
          title: "שגיאה בתשלום",
          description: data.message || "לא ניתן לעבד את התשלום",
          variant: "destructive",
        });
        setStep('payment');
      }
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בתשלום",
        description: error.message,
        variant: "destructive",
      });
      setStep('payment');
    }
  });

  // Mutation pour créer une famille
  const createFamilyMutation = useMutation<Family, Error, CreateFamilyFormValues>({
    mutationFn: async (data: CreateFamilyFormValues) => {
      const res = await apiRequest("POST", "/api/families", data);
      return await res.json();
    },
    onSuccess: (family) => {
      setNewFamily(family);
      
      // Si nous avons un token de carte, procéder au paiement
      if (cardToken) {
        setStep('processing');
        processPaymentMutation.mutate({ 
          familyId: family.id, 
          token: cardToken 
        });
      } else {
        // Pas de token de carte (ne devrait pas arriver dans ce flux)
        toast({
          title: "משפחה נוצרה אך לא הושלם תשלום",
          description: "נא להזין פרטי תשלום",
          variant: "destructive",
        });
        setStep('payment');
      }
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה ביצירת משפחה",
        description: error.message,
        variant: "destructive",
      });
      setStep('info');
    },
  });

  // Gérer la soumission du formulaire d'informations de la famille
  const onInfoSubmit = (data: CreateFamilyFormValues) => {
    setFamilyData(data);
    setStep('payment');
  };

  // Gérer l'enregistrement de la carte
  const handleCardSaved = (cardData: { 
    cardNumberMask: string; 
    expiration: string; 
    token: string 
  }) => {
    setCardToken(cardData.token);
    
    // Afficher un message de confirmation
    toast({
      title: "כרטיס נשמר בהצלחה",
      description: `כרטיס המסתיים ב-${cardData.cardNumberMask.slice(-4)} נשמר`,
    });
  };

  // Gérer la création de la famille avec paiement
  const handleCreateWithPayment = () => {
    if (!familyData || !cardToken) {
      toast({
        title: "חסרים נתונים",
        description: "נא להזין פרטי משפחה ופרטי תשלום",
        variant: "destructive",
      });
      return;
    }
    
    // Créer la famille, puis le paiement sera traité dans onSuccess
    createFamilyMutation.mutate(familyData);
  };

  // Afficher le formulaire d'informations sur la famille
  if (step === 'info') {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-center">יצירת משפחה חדשה</CardTitle>
          <CardDescription className="text-center">
            צור משפחה חדשה כדי להתחיל לשתף תמונות וליצור גזטה
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onInfoSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שם המשפחה</FormLabel>
                    <FormControl>
                      <Input placeholder="לדוגמה: משפחת לוי" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>תמונת משפחה (אופציונלי)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="הכנס את כתובת התמונה" 
                        value={field.value || ''} 
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Alert variant="default" className="bg-muted/50 border-muted">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>שימו לב</AlertTitle>
                <AlertDescription>
                  יצירת משפחה חדשה כרוכה בתשלום דמי מנוי שנתי של 70 ש״ח.
                </AlertDescription>
              </Alert>
              
              <Button 
                type="submit" 
                className="w-full"
              >
                המשך לתשלום
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  // Afficher le formulaire de paiement
  if (step === 'payment') {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-center">תשלום דמי מנוי</CardTitle>
          <CardDescription className="text-center">
            דמי מנוי שנתי למשפחה: 70 ש"ח
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informations sur la famille */}
          <div className="bg-muted/30 p-4 rounded-md">
            <h3 className="font-medium mb-2">פרטי המשפחה</h3>
            <p>שם: {familyData?.name}</p>
          </div>
          
          <CreditCardForm 
            onCardSaved={handleCardSaved}
            buttonText="שמור כרטיס"
            title="פרטי תשלום"
          />
          
          <div className="pt-4">
            <Button 
              onClick={handleCreateWithPayment}
              className="w-full"
              disabled={!cardToken || createFamilyMutation.isPending || processPaymentMutation.isPending}
            >
              {(createFamilyMutation.isPending || processPaymentMutation.isPending) ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CreditCard className="ml-2 h-4 w-4" />
                  צור משפחה ושלם 70 ש"ח
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Afficher l'écran de traitement
  if (step === 'processing') {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-center">מעבד את בקשתך</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
          <p className="text-center text-muted-foreground">
            אנו מעבדים את התשלום שלך ומגדירים את המשפחה החדשה שלך...
          </p>
        </CardContent>
      </Card>
    );
  }

  // Afficher l'écran de succès
  if (step === 'success') {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-green-600">הצלחה!</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <CheckCircle2 className="h-16 w-16 text-green-600 mb-6" />
          <h3 className="text-xl font-semibold mb-2">משפחת {newFamily?.name} נוצרה בהצלחה</h3>
          <p className="text-center text-muted-foreground mb-6">
            התשלום התקבל בהצלחה ותוכל כעת להתחיל להעלות תמונות ולהזמין בני משפחה.
          </p>
          <Button onClick={onSuccess} className="w-full max-w-xs">
            התחל להשתמש
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Fallback
  return null;
}