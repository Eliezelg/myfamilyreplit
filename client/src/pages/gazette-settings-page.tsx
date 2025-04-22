import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertRecipientSchema, Recipient } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2, MapPin, Save } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Schema pour les informations du destinataire
const recipientSchema = insertRecipientSchema.extend({
  name: z.string().min(2, "שם המקבל חייב להכיל לפחות 2 תווים"),
  streetAddress: z.string().min(3, "כתובת חייבת להכיל לפחות 3 תווים"),
  city: z.string().min(2, "עיר חייבת להכיל לפחות 2 תווים"),
  postalCode: z.string().min(1, "מיקוד חייב להכיל ערך"),
  country: z.string().min(2, "מדינה חייבת להכיל לפחות 2 תווים"),
}).omit({ familyId: true, id: true });

type RecipientFormValues = z.infer<typeof recipientSchema>;

export default function GazetteSettingsPage() {
  const [_, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [activeFamilyId, setActiveFamilyId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("recipient");

  // Obtenir les détails de la famille
  const { data: family, isLoading: isFamilyLoading } = useQuery({
    queryKey: ["/api/families", parseInt(id)],
    queryFn: async () => {
      const res = await fetch(`/api/families/${id}`);
      if (!res.ok) throw new Error("Erreur lors du chargement des détails de la famille");
      return await res.json();
    },
    enabled: !!id
  });

  // Obtenir les destinataires existants
  const { data: recipients, isLoading: isRecipientsLoading } = useQuery({
    queryKey: ["/api/families", parseInt(id), "recipients"],
    queryFn: async () => {
      const res = await fetch(`/api/families/${id}/recipients`);
      if (!res.ok) throw new Error("Erreur lors du chargement des destinataires");
      return await res.json();
    },
    enabled: !!id
  });

  // Obtenir les détails de la dernière gazette
  const { data: gazettes, isLoading: isGazettesLoading } = useQuery({
    queryKey: ["/api/families", parseInt(id), "gazettes"],
    queryFn: async () => {
      const res = await fetch(`/api/families/${id}/gazettes`);
      if (!res.ok) throw new Error("Erreur lors du chargement des gazettes");
      return await res.json();
    },
    enabled: !!id
  });

  // Formulaire pour les informations du destinataire
  const form = useForm<RecipientFormValues>({
    resolver: zodResolver(recipientSchema),
    defaultValues: {
      name: "",
      streetAddress: "",
      city: "",
      postalCode: "",
      country: "ישראל", // Valeur par défaut pour le pays
      imageUrl: "",
      active: true
    },
  });

  // Mutation pour ajouter un nouveau destinataire
  const addRecipientMutation = useMutation({
    mutationFn: async (data: RecipientFormValues) => {
      const res = await apiRequest("POST", `/api/families/${id}/recipients`, {
        ...data,
        familyId: parseInt(id)
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "נוסף בהצלחה",
        description: "פרטי הנמען נשמרו בהצלחה",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/families", parseInt(id), "recipients"] });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בשמירת הנמען",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation pour modifier un destinataire existant
  const updateRecipientMutation = useMutation({
    mutationFn: async ({ recipientId, data }: { recipientId: number, data: RecipientFormValues }) => {
      const res = await apiRequest("PUT", `/api/families/${id}/recipients/${recipientId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "עודכן בהצלחה",
        description: "פרטי הנמען עודכנו בהצלחה",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/families", parseInt(id), "recipients"] });
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בעדכון הנמען",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Charger les données du destinataire existant (si disponible)
  useEffect(() => {
    if (recipients && recipients.length > 0) {
      const firstRecipient = recipients[0] as Recipient;
      form.reset({
        name: firstRecipient.name,
        streetAddress: firstRecipient.streetAddress,
        city: firstRecipient.city,
        postalCode: firstRecipient.postalCode,
        country: firstRecipient.country,
        imageUrl: firstRecipient.imageUrl || "",
        active: firstRecipient.active
      });
    }
  }, [recipients, form]);

  // Gérer la soumission du formulaire destinataire
  const onSubmit = (data: RecipientFormValues) => {
    if (recipients && recipients.length > 0) {
      // Mise à jour du destinataire existant
      updateRecipientMutation.mutate({ 
        recipientId: recipients[0].id, 
        data: {
          ...data,
          familyId: parseInt(id)
        }
      });
    } else {
      // Ajout d'un nouveau destinataire
      addRecipientMutation.mutate(data);
    }
  };

  // Afficher un loader pendant le chargement
  if (isFamilyLoading || isRecipientsLoading || isGazettesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Afficher un message si la famille n'est pas trouvée
  if (!family) {
    return (
      <Alert variant="destructive" className="max-w-lg mx-auto mt-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>משפחה לא נמצאה</AlertTitle>
        <AlertDescription>
          לא ניתן למצוא את המשפחה המבוקשת. נא לחזור לדף הראשי ולנסות שוב.
        </AlertDescription>
        <Button variant="outline" className="mt-4" onClick={() => setLocation("/")}>
          חזרה לדף הראשי
        </Button>
      </Alert>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">הגדרות הגזטה - {family.name}</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-3xl mx-auto">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="recipient">
            <MapPin className="ml-2 h-4 w-4" />
            פרטי משלוח
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="recipient" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>פרטי משלוח הגזטה</CardTitle>
              <CardDescription>
                הפרטים הללו ישמשו לשליחת הגזטה המודפסת מדי חודש
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
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
                    control={form.control}
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
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>עיר</FormLabel>
                          <FormControl>
                            <Input placeholder="עיר" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>מיקוד</FormLabel>
                          <FormControl>
                            <Input placeholder="מיקוד" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>מדינה</FormLabel>
                        <FormControl>
                          <Input placeholder="מדינה" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full mt-6"
                    disabled={addRecipientMutation.isPending || updateRecipientMutation.isPending}
                  >
                    {addRecipientMutation.isPending || updateRecipientMutation.isPending ? (
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="ml-2 h-4 w-4" />
                        {recipients && recipients.length > 0 ? 'עדכן פרטי משלוח' : 'הוסף פרטי משלוח'}
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          {gazettes && gazettes.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">גזטות קודמות</h3>
              <div className="grid gap-4">
                {gazettes.map((gazette) => (
                  <Card key={gazette.id}>
                    <CardHeader className="py-4">
                      <CardTitle className="text-lg">{formatMonthYear(gazette.monthYear)}</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-muted-foreground">סטטוס: {translateStatus(gazette.status)}</p>
                          {gazette.pdfUrl && (
                            <a 
                              href={gazette.pdfUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline text-sm mt-1 inline-block"
                            >
                              צפה בגזטה
                            </a>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Fonction utilitaire pour formater le mois/année
function formatMonthYear(monthYear: string): string {
  const [year, month] = monthYear.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  
  // Formatter en hébreu
  return new Intl.DateTimeFormat('he-IL', { 
    month: 'long', 
    year: 'numeric' 
  }).format(date);
}

// Fonction utilitaire pour traduire le statut
function translateStatus(status: string): string {
  const statuses: {[key: string]: string} = {
    'pending': 'ממתין',
    'complete': 'הושלם',
    'error': 'שגיאה',
    'printed': 'מודפס',
    'sent': 'נשלח'
  };
  
  return statuses[status] || status;
}