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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { toast } = useToast();

  // Charger l'image directement dans un canvas HTML standard
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error("Impossible d'obtenir le contexte 2D du canvas");
      return;
    }
    
    // Assurons-nous que l'URL est complète
    // Si l'URL commence par /uploads, nous devons l'ajuster pour qu'elle soit accessible
    const fullImageUrl = imageUrl.startsWith('/uploads/') 
      ? `${window.location.origin}${imageUrl}`
      : imageUrl;
    
    console.log("Chargement de l'image dans l'éditeur simple:", fullImageUrl);
    
    // Réinitialiser l'état
    setImageError(false);
    setImageLoaded(false);
    
    // Créer un élément image HTML pour charger l'image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      console.log("Image chargée avec succès:", img.width, "x", img.height);
      
      // Définir les dimensions du canvas en fonction de l'image
      const maxWidth = 800;
      const maxHeight = 600;
      
      let drawWidth = img.width;
      let drawHeight = img.height;
      
      // Redimensionner si l'image est trop grande
      if (img.width > maxWidth || img.height > maxHeight) {
        const ratio = Math.min(
          maxWidth / img.width,
          maxHeight / img.height
        );
        drawWidth = img.width * ratio;
        drawHeight = img.height * ratio;
      }
      
      // Mettre à jour les dimensions du canvas
      canvas.width = drawWidth;
      canvas.height = drawHeight;
      
      // Dessiner l'image sur le canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, drawWidth, drawHeight);
      
      setImageLoaded(true);
    };
    
    img.onerror = (err) => {
      console.error("Erreur lors du chargement de l'image:", err, "URL:", fullImageUrl);
      setImageError(true);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'image.",
        variant: "destructive",
      });
    };
    
    // Définir la source de l'image APRÈS avoir configuré les gestionnaires d'événements
    img.src = fullImageUrl;
    
    return () => {
      // Annuler le chargement de l'image si le composant est démonté
      img.onload = null;
      img.onerror = null;
    };
  }, [isOpen, imageUrl, toast]);

  const handleSave = () => {
    if (!canvasRef.current) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la sauvegarde.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Simplement obtenir l'image du canvas
      const dataURL = canvasRef.current.toDataURL('image/jpeg', 0.9);
      
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
                <p className="text-sm text-gray-500 mt-2">{imageUrl}</p>
              </div>
            ) : !imageLoaded ? (
              <div className="flex flex-col items-center justify-center p-8">
                <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
                <p className="mt-4 text-sm text-gray-500">Chargement de l'image...</p>
              </div>
            ) : (
              <canvas 
                ref={canvasRef} 
                className="max-w-full border border-gray-300 shadow-sm"
              />
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