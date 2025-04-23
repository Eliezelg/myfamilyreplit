import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LoaderCircle, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getCookie } from "@/lib/utils";

// Schéma de validation pour le formulaire de paiement direct
const directPaymentSchema = z.object({
  cardNumber: z.string()
    .min(13, "מספר הכרטיס חייב להכיל לפחות 13 ספרות")
    .max(19, "מספר הכרטיס יכול להכיל עד 19 ספרות")
    .regex(/^\d+$/, "מספר הכרטיס חייב להכיל ספרות בלבד"),
  
  expDate: z.string()
    .min(4, "תאריך תפוגה חייב להיות בפורמט MMYY")
    .max(4, "תאריך תפוגה חייב להיות בפורמט MMYY")
    .regex(/^\d{4}$/, "תאריך תפוגה חייב להכיל 4 ספרות (MMYY)")
    .refine((val) => {
      const month = parseInt(val.substring(0, 2));
      return month >= 1 && month <= 12;
    }, "החודש חייב להיות בין 01 ל-12"),
  
  cvv: z.string()
    .min(3, "קוד CVV חייב להכיל לפחות 3 ספרות")
    .max(4, "קוד CVV יכול להכיל עד 4 ספרות")
    .regex(/^\d+$/, "קוד CVV חייב להכיל ספרות בלבד"),
  
  holderId: z.string()
    .optional(),
});

export type DirectPaymentFormValues = z.infer<typeof directPaymentSchema>;

interface DirectPaymentFormProps {
  familyId: number;
  amount: number;
  onPaymentSuccess?: (result: any) => void;
  onPaymentFailure?: (error: any) => void;
  buttonText?: string;
  description?: string;
}

export function DirectPaymentForm({
  familyId,
  amount,
  onPaymentSuccess,
  onPaymentFailure,
  buttonText = "שלם",
  description = "הוספת כסף לקופה המשפחתית"
}: DirectPaymentFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Définir le formulaire
  const form = useForm<DirectPaymentFormValues>({
    resolver: zodResolver(directPaymentSchema),
    defaultValues: {
      cardNumber: "",
      expDate: "",
      cvv: "",
      holderId: "",
    },
  });

  // Mutation pour le paiement direct
  const directPaymentMutation = useMutation({
    mutationFn: async (formData: DirectPaymentFormValues) => {
      // D'abord tokeniser la carte
      const tokenizeResponse = await apiRequest("POST", "/api/payments/store-card", {
        cardDetails: {
          cardNumber: formData.cardNumber,
          expDate: formData.expDate,
          cvv: formData.cvv,
          holderId: formData.holderId || undefined,
        },
      });
      
      const tokenizeResult = await tokenizeResponse.json();
      
      if (!tokenizeResult.success || !tokenizeResult.card || !tokenizeResult.card.token) {
        throw new Error(tokenizeResult.message || "לא ניתן לאמת את כרטיס האשראי");
      }
      
      // Utiliser le token pour effectuer le paiement
      const paymentResponse = await apiRequest("POST", "/api/payments/add-funds", {
        familyId,
        amount,
        token: tokenizeResult.card.token
      });
      
      return await paymentResponse.json();
    },
    onSuccess: (data) => {
      setIsSubmitting(false);
      if (data.success) {
        toast({
          title: "התשלום התקבל בהצלחה",
          description: `נוספו ${data.amountFromCard / 100} ש"ח לקופה המשפחתית`,
        });
        
        form.reset();
        
        if (onPaymentSuccess) {
          onPaymentSuccess(data);
        }
      } else {
        toast({
          title: "שגיאה בתשלום",
          description: data.message || "לא ניתן לבצע את התשלום",
          variant: "destructive",
        });
        
        if (onPaymentFailure) {
          onPaymentFailure(data);
        }
      }
    },
    onError: (error: Error) => {
      setIsSubmitting(false);
      toast({
        title: "שגיאה בתשלום",
        description: error.message || "אירעה שגיאה בעת ביצוע התשלום",
        variant: "destructive",
      });
      
      if (onPaymentFailure) {
        onPaymentFailure(error);
      }
    },
  });

  // Gérer la soumission du formulaire
  function onSubmit(data: DirectPaymentFormValues) {
    setIsSubmitting(true);
    directPaymentMutation.mutate(data);
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>פרטי תשלום</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 text-center">
          <div className="text-2xl font-bold">₪{amount / 100}</div>
          <div className="text-sm text-muted-foreground">{description}</div>
        </div>
        
        <Separator className="my-4" />
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="cardNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>מספר כרטיס</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="1234 5678 9012 3456"
                      {...field}
                      disabled={isSubmitting}
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
                    <FormLabel>תאריך תפוגה (MMYY)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0525"
                        maxLength={4}
                        {...field}
                        disabled={isSubmitting}
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
                        disabled={isSubmitting}
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
                  <FormLabel>תעודת זהות (אופציונלי)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="123456789"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  מבצע תשלום...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  {buttonText} - ₪{amount / 100}
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}