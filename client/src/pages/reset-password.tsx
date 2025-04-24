import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

// Schéma de validation pour le formulaire de réinitialisation de mot de passe
const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(/[a-zA-Z]/, "Le mot de passe doit contenir au moins une lettre")
    .regex(/\d/, "Le mot de passe doit contenir au moins un chiffre"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  // Obtenir le token depuis la query string
  const [, params] = useRoute('/reset-password');
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get('token');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Vérifier la validité du token au chargement de la page
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsTokenValid(false);
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiRequest(`/api/password-reset/verify/${token}`, {
          method: 'GET',
        });
        
        setIsTokenValid(response.valid === true);
      } catch (error) {
        console.error('Erreur lors de la vérification du token:', error);
        setIsTokenValid(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) {
      toast({
        title: "Erreur",
        description: "Token invalide ou expiré",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await apiRequest(`/api/password-reset/${token}`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      setIsSuccess(true);
      toast({
        title: "Succès",
        description: "Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.",
      });
      
      // Rediriger vers la page de connexion après 3 secondes
      setTimeout(() => {
        setLocation('/auth');
      }, 3000);
    } catch (error: any) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', error);
      let errorMessage = "Une erreur est survenue lors de la réinitialisation du mot de passe.";
      
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-screen py-2 mx-auto">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Vérification du token en cours...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isTokenValid === false) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-screen py-2 mx-auto">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Lien invalide ou expiré</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Token invalide</AlertTitle>
              <AlertDescription>
                Le lien de réinitialisation est invalide ou a expiré. Veuillez demander un nouveau lien de réinitialisation.
              </AlertDescription>
            </Alert>
            <Button asChild className="w-full">
              <Link href="/forgot-password">Demander un nouveau lien</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen py-2 mx-auto">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Réinitialisation du mot de passe</CardTitle>
          <CardDescription>
            Veuillez créer un nouveau mot de passe pour votre compte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="text-center p-4">
              <h3 className="text-lg font-medium mb-2">Mot de passe réinitialisé</h3>
              <p className="mb-4">
                Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers la page de connexion.
              </p>
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nouveau mot de passe</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Entrez votre nouveau mot de passe" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmer le mot de passe</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Confirmez votre nouveau mot de passe" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="text-sm text-gray-500 mb-4">
                  <p>Le mot de passe doit:</p>
                  <ul className="list-disc list-inside ml-2 mt-1">
                    <li>Contenir au moins 8 caractères</li>
                    <li>Inclure au moins une lettre</li>
                    <li>Inclure au moins un chiffre</li>
                  </ul>
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Réinitialisation en cours...
                    </>
                  ) : (
                    "Réinitialiser le mot de passe"
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="link" asChild>
            <Link href="/auth">Retour à la connexion</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}