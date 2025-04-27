import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Copy, Check, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FamilyEmailSettingsProps {
  familyId: number;
  isAdmin: boolean;
}

export default function FamilyEmailSettings({ familyId, isAdmin }: FamilyEmailSettingsProps) {
  const { t } = useTranslation('dashboard');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  interface EmailAliasResponse {
    emailAlias: string;
  }

  // État pour stocker l'alias email
  const [emailAlias, setEmailAlias] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour récupérer l'alias email de la famille
  const fetchEmailAlias = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiRequest('GET', `/api/email-webhook/family/${familyId}/email-alias`);
      
      if (response.ok) {
        const data = await response.json();
        setEmailAlias(data.emailAlias);
      } else {
        // Si le statut est 404, c'est normal - aucun alias n'existe encore
        if (response.status === 404) {
          setEmailAlias(null);
        } else {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
      }
    } catch (err) {
      console.error('Erreur lors de la récupération de l\'alias email:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }, [familyId]);

  // Charger l'alias email au chargement du composant
  useEffect(() => {
    if (familyId) {
      fetchEmailAlias();
    }
  }, [familyId, fetchEmailAlias]);

  // État pour suivre si une génération est en cours
  const [isGenerating, setIsGenerating] = useState(false);

  // Fonction pour générer un nouvel alias email
  const generateEmailAlias = async () => {
    try {
      setIsGenerating(true);
      
      const response = await apiRequest('POST', `/api/email-webhook/family/${familyId}/email-alias`);
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Adresse email générée",
          description: "L'adresse email dédiée a été générée avec succès",
          variant: "default",
        });
        
        // Rafraîchir les données pour afficher le nouvel alias
        fetchEmailAlias();
      } else {
        const errorText = await response.text();
        throw new Error(errorText || "Échec de la génération de l'adresse email");
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la génération de l'adresse email",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Fonction pour copier l'adresse email dans le presse-papier
  const copyToClipboard = () => {
    if (emailAlias) {
      navigator.clipboard.writeText(emailAlias);
      setCopied(true);
      toast({
        title: "Copié !",
        description: "L'adresse email a été copiée dans le presse-papier",
        variant: "default",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Adresse email dédiée
        </CardTitle>
        <CardDescription>
          Chaque famille dispose d'une adresse email dédiée pour envoyer des photos directement dans la galerie
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-20">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : emailAlias ? (
          <div className="bg-muted p-3 rounded-md flex items-center justify-between">
            <span className="font-medium break-all">{emailAlias}</span>
            <Button variant="ghost" size="icon" onClick={copyToClipboard}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        ) : (
          <div className="text-muted-foreground text-sm">
            {isAdmin 
              ? "Aucune adresse email n'a encore été générée pour cette famille." 
              : "Demandez à l'administrateur de la famille de générer une adresse email dédiée."}
          </div>
        )}
      </CardContent>
      {isAdmin && (
        <CardFooter>
          <Button 
            variant={emailAlias ? "outline" : "default"} 
            onClick={generateEmailAlias}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating && (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            )}
            {emailAlias ? "Régénérer l'adresse email" : "Générer une adresse email"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
