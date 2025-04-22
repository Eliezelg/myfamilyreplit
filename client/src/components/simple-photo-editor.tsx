import { useEffect, useRef, useState } from "react";
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

export default function SimplePhotoEditor({
  isOpen,
  onClose,
  imageUrl,
  onSave,
  initialCaption = "",
}: PhotoEditorProps) {
  const [caption, setCaption] = useState(initialCaption);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { toast } = useToast();

  // Construire l'URL complète de l'image
  const fullImageUrl = imageUrl.startsWith('/uploads/') 
    ? `${window.location.origin}${imageUrl}`
    : imageUrl;

  useEffect(() => {
    // Réinitialiser l'état lorsque le dialogue s'ouvre
    if (isOpen) {
      setImageError(false);
      setImageLoaded(false);
      console.log("URL complète de l'image:", fullImageUrl);
    }
  }, [isOpen, fullImageUrl]);

  const handleImageLoad = () => {
    console.log("Image chargée avec succès");
    setImageLoaded(true);
  };

  const handleImageError = (err: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error("Erreur lors du chargement de l'image:", err);
    setImageError(true);
    toast({
      title: "Erreur",
      description: "Impossible de charger l'image.",
      variant: "destructive",
    });
  };

  const handleSave = () => {
    if (!imgRef.current || !canvasRef.current) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la sauvegarde: aucune image chargée.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Créer un canvas temporaire pour la conversion
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error("Impossible d'obtenir le contexte 2D du canvas");
      }
      
      // Définir les dimensions du canvas en fonction de l'image
      const img = imgRef.current;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      // Dessiner l'image sur le canvas
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Convertir en data URL
      const dataURL = canvas.toDataURL('image/jpeg', 0.9);
      
      onSave(dataURL, caption);
      toast({
        title: "Image sauvegardée",
        description: "La légende a été mise à jour avec succès.",
      });
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'image.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">Modifier la photo</DialogTitle>
          <DialogDescription>
            Modifiez la légende de la photo ou sauvegardez directement l'image.
          </DialogDescription>
          <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-4 right-4">
            <X className="h-6 w-6" />
          </Button>
        </DialogHeader>
        
        <div className="space-y-4 overflow-y-auto max-h-[70vh]">
          {/* Zone d'affichage de l'image */}
          <div className="flex justify-center bg-gray-100 p-4 rounded-md">
            {imageError ? (
              <div className="flex flex-col items-center justify-center p-8 text-red-500">
                <p>Impossible de charger l'image</p>
                <p className="text-sm text-gray-500 mt-2">{fullImageUrl}</p>
              </div>
            ) : (
              <>
                {!imageLoaded && (
                  <div className="absolute flex flex-col items-center justify-center p-8">
                    <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
                    <p className="mt-4 text-sm text-gray-500">Chargement de l'image...</p>
                  </div>
                )}
                <img 
                  ref={imgRef}
                  src={fullImageUrl}
                  alt="Image à éditer"
                  className={`max-w-full border border-gray-300 shadow-sm ${!imageLoaded ? 'opacity-0' : 'opacity-100'}`}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  crossOrigin="anonymous"
                />
                {/* Canvas invisible utilisé uniquement pour la sauvegarde */}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </>
            )}
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
            />
          </div>
        </div>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button 
            onClick={handleSave} 
            disabled={!imageLoaded}
          >
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}