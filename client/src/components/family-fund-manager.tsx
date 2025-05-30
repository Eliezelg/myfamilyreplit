import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DirectPaymentForm } from "./direct-payment-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CreditCard, PlusCircle, Receipt } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { FamilyFund, FundTransaction } from "@shared/schema";

// Les montants sont en agorot (centimes de shekel)
const DEFAULT_AMOUNTS = [5000, 10000, 20000]; // 50, 100, 200 shekels

interface FamilyFundManagerProps {
  familyId: number;
}

export function FamilyFundManager({ familyId }: FamilyFundManagerProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState(10000); // 100 shekels par défaut
  const [customAmount, setCustomAmount] = useState("");
  const [showCustomAmount, setShowCustomAmount] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const queryClient = useQueryClient();

  // Récupérer les informations du fonds de famille
  const { data: familyFund, isLoading: isLoadingFund } = useQuery<FamilyFund>({
    queryKey: ["/api/families", familyId, "fund"],
  });

  // Récupérer l'historique des transactions
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery<FundTransaction[]>({
    queryKey: ["/api/families", familyId, "fund/transactions"],
  });

  // Gérer la sélection du montant
  const handleAmountSelect = (selectedAmount: number) => {
    setAmount(selectedAmount);
    setShowCustomAmount(false);
  };

  // Gérer la saisie du montant personnalisé
  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setCustomAmount(value);
    
    // Convertir en agorot si la valeur n'est pas vide
    if (value) {
      setAmount(parseInt(value) * 100);
    } else {
      setAmount(0);
    }
  };

  // Gérer le succès du paiement
  const handlePaymentSuccess = () => {
    // Fermer le formulaire de paiement
    setShowPaymentForm(false);
    
    // Réinitialiser les montants
    setCustomAmount("");
    setAmount(10000);
    
    // Rafraîchir les données
    queryClient.invalidateQueries({ queryKey: ["/api/families", familyId, "fund"] });
    queryClient.invalidateQueries({ queryKey: ["/api/families", familyId, "fund/transactions"] });
    queryClient.invalidateQueries({ queryKey: ["/api/families"] }); // Invalider toutes les données des familles
  };

  // Formater la date pour l'affichage
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return new Intl.DateTimeFormat('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {showPaymentForm ? (
        <div>
          <Button 
            variant="outline" 
            onClick={() => setShowPaymentForm(false)}
            className="mb-4"
          >
            חזרה לבחירת הסכום
          </Button>
          
          <DirectPaymentForm 
            familyId={familyId}
            amount={amount}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentFailure={() => {}}
            buttonText="הוסף כסף לקופה"
          />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>קופה משפחתית</CardTitle>
            <CardDescription>
              הקופה המשפחתית מאפשרת לכם לשלם עבור מנוי, תמונות ופעילויות משפחתיות
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Afficher le solde actuel */}
            <div className="bg-primary/10 p-6 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">יתרה נוכחית</p>
              <h2 className="text-3xl font-bold">
                {isLoadingFund ? (
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                ) : (
                  `${(familyFund?.balance || 0) / 100} ש"ח`
                )}
              </h2>
            </div>

            {/* Sélection du montant */}
            <div className="space-y-3">
              <Label>סכום להפקדה</Label>
              <div className="grid grid-cols-3 gap-3">
                {DEFAULT_AMOUNTS.map((amt) => (
                  <Button
                    key={amt}
                    type="button"
                    variant={amount === amt && !showCustomAmount ? "default" : "outline"}
                    onClick={() => handleAmountSelect(amt)}
                  >
                    {amt / 100} ש"ח
                  </Button>
                ))}
              </div>
              
              <div className="flex items-center mt-3">
                <Button
                  type="button"
                  variant={showCustomAmount ? "default" : "outline"}
                  onClick={() => setShowCustomAmount(true)}
                  className="w-full"
                >
                  סכום אחר
                </Button>
              </div>
              
              {showCustomAmount && (
                <div className="mt-3">
                  <Label>סכום מותאם אישית (ש"ח)</Label>
                  <Input
                    type="text"
                    value={customAmount}
                    onChange={handleCustomAmountChange}
                    placeholder="הכנס סכום בשקלים"
                    className="mt-1"
                  />
                </div>
              )}
            </div>

            <Button
              onClick={() => setShowPaymentForm(true)}
              className="w-full"
              disabled={amount <= 0}
            >
              <PlusCircle className="ml-2 h-4 w-4" />
              המשך להוספת {amount / 100} ש"ח לקופה
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Historique des transactions */}
      <Card>
        <CardHeader>
          <CardTitle>היסטוריית עסקאות</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingTransactions ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : transactions?.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">
              אין עסקאות להצגה
            </p>
          ) : (
            <div className="space-y-4">
              {transactions?.map((transaction: FundTransaction) => (
                <div key={transaction.id} className="border-b pb-4 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(transaction.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'deposit' ? '+' : '-'}{transaction.amount / 100} ש"ח
                      </p>
                      {transaction.referenceNumber && (
                        <p className="text-xs text-muted-foreground">
                          מס' אסמכתא: {transaction.referenceNumber}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}