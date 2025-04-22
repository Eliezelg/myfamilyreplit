import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { X, Save } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface PhotoEditorProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onSave: (editedImageUrl: string, caption: string) => void;
  initialCaption?: string;
}

/**
 * Éditeur de photo simplifié qui permet uniquement de modifier la légende
 * sans manipulation de l'image pour éviter les problèmes de blob URLs
 */
export default function SimplePhotoEditor({
  isOpen,
  onClose,
  imageUrl,
  onSave,
  initialCaption = "",
}: PhotoEditorProps) {
  const [caption, setCaption] = useState(initialCaption);
  const { toast } = useToast();

  const handleSave = () => {
    try {
      console.log("Sauvegarde de la légende uniquement");
      
      // Nous conservons l'URL d'origine et ne modifions que la légende
      onSave(imageUrl, caption);
      
      toast({
        title: "Légende sauvegardée",
        description: "La légende a été mise à jour avec succès.",
      });
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-lg max-h-[90vh]" aria-describedby="photo-caption-editor-description">
        <DialogHeader>
          <DialogTitle className="text-xl">Modifier la légende</DialogTitle>
          <DialogDescription id="photo-caption-editor-description">
            Modifiez la légende de cette photo.
          </DialogDescription>
          <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-4 right-4">
            <X className="h-6 w-6" />
          </Button>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Message d'information */}
          <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-700 mb-4">
            Pour des raisons techniques, l'aperçu de l'image n'est pas disponible. 
            Vous pouvez cependant modifier la légende.
          </div>
          
          {/* Champ pour la légende */}
          <div>
            <h3 className="text-sm font-medium mb-2">Légende</h3>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Ajouter une légende à cette photo..."
              className="w-full p-2"
              rows={3}
              autoFocus
            />
          </div>
        </div>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}