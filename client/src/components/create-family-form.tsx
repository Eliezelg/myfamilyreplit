import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertFamilySchema, Family, insertRecipientSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, CreditCard, CheckCircle2, MapPin, ArrowRight } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CreditCardForm } from "./credit-card-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

// Schema pour les informations de la famille
const createFamilySchema = insertFamilySchema.extend({
  name: z.string().min(2, "שם המשפחה חייב להכיל לפחות 2 תווים"),
});

// Schema pour les informations du destinataire
const createRecipientSchema = insertRecipientSchema.extend({
  name: z.string().min(2, "שם המקבל חייב להכיל לפחות 2 תווים"),
  streetAddress: z.string().min(3, "כתובת חייבת להכיל לפחות 3 תווים"),
  city: z.string().min(2, "עיר חייבת להכיל לפחות 2 תווים"),
  postalCode: z.string().min(1, "מיקוד חייב להכיל ערך"),
  country: z.string().min(2, "מדינה חייבת להכיל לפחות 2 תווים"),
}).omit({ familyId: true });

// Types pour les formulaires
type CreateFamilyFormValues = z.infer<typeof createFamilySchema>;
type CreateRecipientFormValues = z.infer<typeof createRecipientSchema>;

interface CreateFamilyFormProps {
  onSuccess?: () => void;
}

// Prix de l'abonnement en shekels (en agorot)
const SUBSCRIPTION_PRICE = 7000; // 70 shekels

export default function CreateFamilyForm({ onSuccess }: CreateFamilyFormProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'info' | 'recipient' | 'payment' | 'processing' | 'success'>('info');
  const [cardToken, setCardToken] = useState<string | null>(null);
  const [familyData, setFamilyData] = useState<CreateFamilyFormValues | null>(null);
  const [recipientData, setRecipientData] = useState<CreateRecipientFormValues | null>(null);
  const [addRecipientLater, setAddRecipientLater] = useState(false);
  const [newFamily, setNewFamily] = useState<Family | null>(null);

  // Formulaire pour les informations de la famille
  const familyForm = useForm<CreateFamilyFormValues>({
    resolver: zodResolver(createFamilySchema),
    defaultValues: {
      name: "",
      imageUrl: "", // Ensure this is always a string, never null
    },
  });

  // Formulaire pour les informations du destinataire
  const recipientForm = useForm<CreateRecipientFormValues>({
    resolver: zodResolver(createRecipientSchema),
    defaultValues: {
      name: "",
      streetAddress: "",
      city: "",
      postalCode: "",
      country: "ישראל", // Valeur par défaut pour le pays (Israël)
      imageUrl: "",
    },
    mode: "onBlur", // Valider au blur pour une meilleure expérience utilisateur
  });

  // Mutation pour créer une famille avec paiement intégré (nouveau processus)
  const createFamilyWithPaymentMutation = useMutation({
    mutationFn: async ({ 
      familyData, 
      paymentToken, 
      recipientData,
      addRecipientLater
    }: { 
      familyData: CreateFamilyFormValues, 
      paymentToken: string,
      recipientData?: CreateRecipientFormValues,
      addRecipientLater: boolean 
    }) => {
      const response = await apiRequest("POST", "/api/families/create-with-payment", {
        familyData,
        paymentToken,
        recipientData,
        addRecipientLater
      });
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setNewFamily(data.family);
        setStep('success');
        toast({
          title: "המשפחה נוצרה בהצלחה",
          description: "התשלום בוצע והמשפחה נוצרה",
        });
        // Invalider les requêtes pour recharger les données des familles
        queryClient.invalidateQueries({ queryKey: ["/api/families"] });
        if (onSuccess) setTimeout(onSuccess, 1500);
      } else {
        if (data.paymentError) {
          toast({
            title: "שגיאה בתשלום",
            description: data.message || "לא ניתן לעבד את התשלום",
            variant: "destructive",
          });
          setStep('payment');
        } else {
          toast({
            title: "שגיאה ביצירת משפחה",
            description: data.message || "אירעה שגיאה בעת יצירת המשפחה",
            variant: "destructive",
          });
          setStep('info');
        }
      }
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה במערכת",
        description: error.message,
        variant: "destructive",
      });
      setStep('info');
    }
  });

  // Gérer la soumission du formulaire d'informations de la famille
  const onInfoSubmit = (data: CreateFamilyFormValues) => {
    setFamilyData(data);
    setStep('recipient');
  };

  // Gérer la soumission du formulaire d'informations du destinataire
  const onRecipientSubmit = (data: CreateRecipientFormValues) => {
    setRecipientData(data);
    setStep('payment');
  };

  // Gérer le choix d'ajouter le destinataire plus tard
  const handleSkipRecipient = () => {
    setAddRecipientLater(true);
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

  // Gérer la création de la famille avec paiement (nouveau processus)
  const handleCreateWithPayment = () => {
    if (!familyData || !cardToken) {
      toast({
        title: "חסרים נתונים",
        description: "נא להזין פרטי משפחה ופרטי תשלום",
        variant: "destructive",
      });
      return;
    }

    setStep('processing');

    // Créer la famille avec le nouveau processus intégré (paiement d'abord, puis création)
    createFamilyWithPaymentMutation.mutate({
      familyData,
      paymentToken: cardToken,
      recipientData: addRecipientLater ? undefined : recipientData || undefined,
      addRecipientLater
    });
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
          <Form {...familyForm}>
            <form onSubmit={familyForm.handleSubmit(onInfoSubmit)} className="space-y-4">
              <FormField
                control={familyForm.control}
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
                control={familyForm.control}
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
                המשך
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  // Afficher le formulaire des informations du destinataire
  if (step === 'recipient') {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-center">פרטי משלוח הגזטה</CardTitle>
          <CardDescription className="text-center">
            הזן את פרטי המקבל עבור משלוח הגזטה המודפסת
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...recipientForm}>
            <form onSubmit={recipientForm.handleSubmit(onRecipientSubmit)} className="space-y-4">
              <FormField
                control={recipientForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שם המקבל</FormLabel>
                    <FormControl>
                      <Input placeholder="שם מלא של מקבל הגזטה" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={recipientForm.control}
                name="streetAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>כתובת</FormLabel>
                    <FormControl>
                      <Input placeholder="רחוב ומספר בית" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={recipientForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>עיר</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="עיר" 
                          value={field.value || ""} 
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={recipientForm.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>מיקוד</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="מיקוד" 
                          value={field.value || ""} 
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={recipientForm.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>מדינה</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="מדינה" 
                        value={field.value || ""} 
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col space-y-2 mt-4">
                <Button 
                  type="submit" 
                  className="w-full"
                >
                  <ArrowRight className="ml-2 h-4 w-4" />
                  המשך לתשלום
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  className="w-full"
                  onClick={handleSkipRecipient}
                >
                  אוסיף את הפרטים מאוחר יותר
                </Button>
              </div>
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
            {recipientData && !addRecipientLater && (
              <div className="mt-2">
                <p className="font-medium mt-2">פרטי משלוח הגזטה:</p>
                <p>{recipientData.name}</p>
                <p>{recipientData.streetAddress}</p>
                <p>{recipientData.city}, {recipientData.postalCode}</p>
                <p>{recipientData.country}</p>
              </div>
            )}
            {addRecipientLater && (
              <p className="mt-2 text-muted-foreground italic">
                * פרטי משלוח הגזטה יתווספו מאוחר יותר
              </p>
            )}
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
              disabled={!cardToken || createFamilyWithPaymentMutation.isPending}
            >
              {createFamilyWithPaymentMutation.isPending ? (
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