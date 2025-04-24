import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LoaderCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Schéma de validation pour le formulaire de carte de crédit
const creditCardSchema = z.object({
  cardNumber: z.string()
    .min(13, "Le numéro de carte doit comporter au moins 13 chiffres")
    .max(19, "Le numéro de carte doit comporter au maximum 19 chiffres")
    .regex(/^\d+$/, "Le numéro de carte doit contenir uniquement des chiffres"),
  
  expDate: z.string()
    .min(4, "La date d'expiration doit être au format MMYY")
    .max(4, "La date d'expiration doit être au format MMYY")
    .regex(/^\d{4}$/, "La date d'expiration doit contenir 4 chiffres (MMYY)")
    .refine((val) => {
      const month = parseInt(val.substring(0, 2));
      return month >= 1 && month <= 12;
    }, "Le mois doit être entre 01 et 12"),
  
  cvv: z.string()
    .min(3, "Le code CVV doit comporter au moins 3 chiffres")
    .max(4, "Le code CVV doit comporter au maximum 4 chiffres")
    .regex(/^\d+$/, "Le code CVV doit contenir uniquement des chiffres"),
  
  holderId: z.string()
    .optional(),
});

export type CreditCardFormValues = z.infer<typeof creditCardSchema>;

// Types pour les données de réponse
interface StoredCardResponse {
  success: boolean;
  card: {
    cardNumberMask: string;
    expiration: string;
    token: string;
  };
}

interface CreditCardFormProps {
  onCardSaved: (cardData: { 
    cardNumberMask: string; 
    expiration: string; 
    token: string 
  }) => void;
  buttonText?: string;
  title?: string;
  loading?: boolean;
  disabled?: boolean;
  buttonDisabled?: boolean;
  onButtonClick?: () => void;
  buttonIcon?: React.ReactNode;
  showSpinner?: boolean;
}

export function CreditCardForm({ 
  onCardSaved, 
  buttonText = "Sauvegarder la carte", 
  title = "Informations de paiement",
  loading = false,
  disabled = false,
  buttonDisabled,
  onButtonClick,
  buttonIcon,
  showSpinner = false
}: CreditCardFormProps) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(true);
  const [storedCardInfo, setStoredCardInfo] = useState<{
    cardNumberMask: string;
    expiration: string;
    token: string;
  } | null>(null);

  // Définir le formulaire
  const form = useForm<CreditCardFormValues>({
    resolver: zodResolver(creditCardSchema),
    defaultValues: {
      cardNumber: "",
      expDate: "",
      cvv: "",
      holderId: "",
    },
  });

  // Mutation pour enregistrer la carte
  const storeCardMutation = useMutation({
    mutationFn: async (data: CreditCardFormValues) => {
      const response = await apiRequest("POST", "/api/payments/store-card", {
        cardDetails: {
          cardNumber: data.cardNumber,
          expDate: data.expDate,
          cvv: data.cvv,
          holderId: data.holderId || undefined,
        },
      });
      return await response.json() as StoredCardResponse;
    },
    onSuccess: (data) => {
      if (data.success && data.card) {
        toast({
          title: "Carte enregistrée",
          description: `Carte se terminant par ${data.card.cardNumberMask.slice(-4)} enregistrée avec succès.`,
        });
        setStoredCardInfo(data.card);
        setShowForm(false);
        onCardSaved(data.card);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible d'enregistrer la carte",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'enregistrement de la carte.",
        variant: "destructive",
      });
    },
  });

  // Gérer la soumission du formulaire
  function onSubmit(data: CreditCardFormValues) {
    storeCardMutation.mutate(data);
  }

  // Gérer le changement de carte
  function handleChangeCard() {
    setShowForm(true);
    setStoredCardInfo(null);
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {showForm ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="cardNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro de carte</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="1234 5678 9012 3456"
                        {...field}
                        disabled={disabled || storeCardMutation.isPending || loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="expDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date d'expiration (MMYY)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0525"
                          maxLength={4}
                          {...field}
                          disabled={disabled || storeCardMutation.isPending || loading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cvv"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CVV</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="123"
                          maxLength={4}
                          {...field}
                          disabled={disabled || storeCardMutation.isPending || loading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="holderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro d'identité (optionnel)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123456789"
                        {...field}
                        disabled={disabled || storeCardMutation.isPending || loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type={onButtonClick ? "button" : "submit"}
                className="w-full" 
                disabled={buttonDisabled !== undefined ? buttonDisabled : disabled || storeCardMutation.isPending || loading}
                onClick={onButtonClick && storedCardInfo ? (e) => {
                  e.preventDefault();
                  onButtonClick();
                } : undefined}
              >
                {(storeCardMutation.isPending || showSpinner) ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : buttonIcon || null}
                {buttonText}
              </Button>
            </form>
          </Form>
        ) : storedCardInfo ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">Carte enregistrée</p>
              <p className="mt-1">
                •••• •••• •••• {storedCardInfo.cardNumberMask.slice(-4)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Expire {storedCardInfo.expiration.slice(0, 2)}/{storedCardInfo.expiration.slice(2, 4)}
              </p>
            </div>
            
            {onButtonClick && (
              <Button 
                onClick={onButtonClick}
                className="w-full mt-4" 
                disabled={buttonDisabled}
              >
                {showSpinner ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : buttonIcon || null}
                {buttonText}
              </Button>
            )}
          </div>
        ) : null}
      </CardContent>
      {!showForm && storedCardInfo && (
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleChangeCard}
            disabled={disabled || loading}
          >
            Changer de carte
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}