import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/api-request';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Mail, Bell, Save, RefreshCw } from 'lucide-react';

interface NotificationPreference {
  id: number;
  userId: number;
  newPhotoEmail: boolean;
  newPhotoPush: boolean;
  newCommentEmail: boolean;
  newCommentPush: boolean;
  newReactionEmail: boolean;
  newReactionPush: boolean;
  newGazetteEmail: boolean;
  newGazettePush: boolean;
  familyEventEmail: boolean;
  familyEventPush: boolean;
  weeklyDigestEmail: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('email');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Charger les préférences de notification
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await apiRequest('GET', '/api/notification-preferences');
        
        if (response.ok) {
          const data = await response.json();
          setPreferences(data);
        } else {
          if (response.status === 404) {
            // Aucune préférence trouvée, on utilisera les valeurs par défaut
            setPreferences(null);
          } else {
            throw new Error(`Erreur ${response.status}: ${response.statusText}`);
          }
        }
      } catch (err) {
        console.error('Erreur lors du chargement des préférences de notification:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPreferences();
  }, []);

  // Enregistrer les préférences de notification
  const savePreferences = async () => {
    if (!preferences) return;
    
    try {
      setIsSaving(true);
      setError(null);
      
      const response = await apiRequest('PUT', '/api/notification-preferences', preferences);
      
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
        toast({
          title: 'Préférences enregistrées',
          description: 'Vos préférences de notification ont été mises à jour avec succès.',
        });
      } else {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement des préférences de notification:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      toast({
        title: 'Erreur',
        description: 'Impossible d\'enregistrer vos préférences de notification.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Mettre à jour une préférence
  const updatePreference = (key: keyof NotificationPreference, value: boolean) => {
    if (!preferences) {
      // Créer un nouvel objet de préférences avec les valeurs par défaut
      const defaultPreferences: Partial<NotificationPreference> = {
        newPhotoEmail: true,
        newPhotoPush: true,
        newCommentEmail: true,
        newCommentPush: true,
        newReactionEmail: false,
        newReactionPush: true,
        newGazetteEmail: true,
        newGazettePush: true,
        familyEventEmail: true,
        familyEventPush: true,
        weeklyDigestEmail: true,
      };
      
      setPreferences({ 
        ...defaultPreferences, 
        [key]: value 
      } as NotificationPreference);
    } else {
      setPreferences({ 
        ...preferences, 
        [key]: value 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Chargement des préférences...</span>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Préférences de notification</CardTitle>
        <CardDescription>
          Personnalisez les notifications que vous souhaitez recevoir.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-destructive/15 text-destructive p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email" className="flex items-center">
              <Mail className="h-4 w-4 mr-2" />
              <span>Emails</span>
            </TabsTrigger>
            <TabsTrigger value="push" className="flex items-center">
              <Bell className="h-4 w-4 mr-2" />
              <span>Notifications push</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="email" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="newPhotoEmail" className="text-base">Nouvelles photos</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir un email lorsqu'une nouvelle photo est ajoutée
                  </p>
                </div>
                <Switch
                  id="newPhotoEmail"
                  checked={preferences?.newPhotoEmail ?? true}
                  onCheckedChange={(checked) => updatePreference('newPhotoEmail', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="newCommentEmail" className="text-base">Nouveaux commentaires</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir un email lorsqu'un commentaire est ajouté à une photo
                  </p>
                </div>
                <Switch
                  id="newCommentEmail"
                  checked={preferences?.newCommentEmail ?? true}
                  onCheckedChange={(checked) => updatePreference('newCommentEmail', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="newReactionEmail" className="text-base">Nouvelles réactions</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir un email lorsqu'une réaction est ajoutée à une photo
                  </p>
                </div>
                <Switch
                  id="newReactionEmail"
                  checked={preferences?.newReactionEmail ?? false}
                  onCheckedChange={(checked) => updatePreference('newReactionEmail', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="newGazetteEmail" className="text-base">Nouvelles gazettes</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir un email lorsqu'une nouvelle gazette est disponible
                  </p>
                </div>
                <Switch
                  id="newGazetteEmail"
                  checked={preferences?.newGazetteEmail ?? true}
                  onCheckedChange={(checked) => updatePreference('newGazetteEmail', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="familyEventEmail" className="text-base">Événements familiaux</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir un email pour les événements familiaux
                  </p>
                </div>
                <Switch
                  id="familyEventEmail"
                  checked={preferences?.familyEventEmail ?? true}
                  onCheckedChange={(checked) => updatePreference('familyEventEmail', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="weeklyDigestEmail" className="text-base">Résumé hebdomadaire</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir un résumé hebdomadaire des activités de la famille
                  </p>
                </div>
                <Switch
                  id="weeklyDigestEmail"
                  checked={preferences?.weeklyDigestEmail ?? true}
                  onCheckedChange={(checked) => updatePreference('weeklyDigestEmail', checked)}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="push" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="newPhotoPush" className="text-base">Nouvelles photos</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir une notification push lorsqu'une nouvelle photo est ajoutée
                  </p>
                </div>
                <Switch
                  id="newPhotoPush"
                  checked={preferences?.newPhotoPush ?? true}
                  onCheckedChange={(checked) => updatePreference('newPhotoPush', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="newCommentPush" className="text-base">Nouveaux commentaires</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir une notification push lorsqu'un commentaire est ajouté à une photo
                  </p>
                </div>
                <Switch
                  id="newCommentPush"
                  checked={preferences?.newCommentPush ?? true}
                  onCheckedChange={(checked) => updatePreference('newCommentPush', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="newReactionPush" className="text-base">Nouvelles réactions</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir une notification push lorsqu'une réaction est ajoutée à une photo
                  </p>
                </div>
                <Switch
                  id="newReactionPush"
                  checked={preferences?.newReactionPush ?? true}
                  onCheckedChange={(checked) => updatePreference('newReactionPush', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="newGazettePush" className="text-base">Nouvelles gazettes</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir une notification push lorsqu'une nouvelle gazette est disponible
                  </p>
                </div>
                <Switch
                  id="newGazettePush"
                  checked={preferences?.newGazettePush ?? true}
                  onCheckedChange={(checked) => updatePreference('newGazettePush', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="familyEventPush" className="text-base">Événements familiaux</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir une notification push pour les événements familiaux
                  </p>
                </div>
                <Switch
                  id="familyEventPush"
                  checked={preferences?.familyEventPush ?? true}
                  onCheckedChange={(checked) => updatePreference('familyEventPush', checked)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end mt-6 space-x-2">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            disabled={isSaving}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
          <Button 
            onClick={savePreferences}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
