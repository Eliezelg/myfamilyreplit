"use client"

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

// Schéma de validation pour la carte de crédit
const creditCardSchema = z.object({
  cardNumber: z.string().regex(/^[0-9]{16}$/, {
    message: "Le numéro de carte doit contenir 16 chiffres",
  }),
  expDate: z.string().regex(/^(0[1-9]|1[0-2])\d{2}$/, {
    message: "La date d'expiration doit être au format MMYY",
  }),
  cvv: z.string().regex(/^[0-9]{3,4}$/, {
    message: "Le code CVV doit contenir 3 ou 4 chiffres",
  }),
  holderId: z.string().optional(),
});

export type CreditCardFormValues = z.infer<typeof creditCardSchema>;

// Type pour le résultat du stockage de la carte
type CardSavedResult = {
  cardNumberMask: string; // les 4 derniers chiffres
  expiration: string;
  token: string;
};

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
  buttonText = "Payer", 
  title = "Informations de paiement",
  loading = false,
  disabled = false,
  buttonDisabled,
  onButtonClick,
  buttonIcon,
  showSpinner = false
}: CreditCardFormProps) {
  const { toast } = useToast();
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

  // Mutation pour stocker la carte
  const storeCardMutation = useMutation({
    mutationFn: async (data: CreditCardFormValues) => {
      // Simuler un appel API pour stocker les informations de carte
      return new Promise<CardSavedResult>((resolve) => {
        setTimeout(() => {
          const lastFourDigits = data.cardNumber.slice(-4);
          const cardNumberMask = lastFourDigits;
          const token = `card_${Math.random().toString(36).substring(2, 15)}`;
          
          resolve({
            cardNumberMask,
            expiration: data.expDate,
            token,
          });
        }, 500); // Délai réseau réduit pour une meilleure expérience
      });
    },
    onSuccess: (data) => {
      setStoredCardInfo(data);
      onCardSaved(data);
      
      // Si le callback de bouton existe, l'exécuter après l'enregistrement de la carte
      if (onButtonClick) {
        onButtonClick();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur lors du traitement de la carte",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Gérer le clic sur le bouton principal (combinant enregistrement de carte et paiement)
  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    // Vérifier si le formulaire est valide avant de procéder
    form.trigger().then(isValid => {
      if (isValid) {
        // Si la carte est déjà enregistrée, appeler directement le callback
        if (storedCardInfo && onButtonClick) {
          onButtonClick();
        } else {
          // Sinon, enregistrer d'abord la carte (le callback sera appelé automatiquement dans onSuccess)
          storeCardMutation.mutate(form.getValues());
        }
      }
    });
  };

  // Notice discrète affichée uniquement si une carte est enregistrée
  const CardSavedNotice = () => {
    if (!storedCardInfo) return null;
    return (
      <div className="text-xs text-green-600 mt-1 text-center">
        Carte •••• {storedCardInfo.cardNumberMask} enregistrée
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-4">
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
                        placeholder="0425"
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
                        type="password"
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
              type="button"
              className="w-full" 
              disabled={buttonDisabled !== undefined ? buttonDisabled : disabled || storeCardMutation.isPending || loading}
              onClick={handleButtonClick}
            >
              {(storeCardMutation.isPending || showSpinner) ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : buttonIcon || null}
              {buttonText}
            </Button>
            
            <CardSavedNotice />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}