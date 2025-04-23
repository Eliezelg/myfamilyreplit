import { useState, useCallback, useRef, useTransition } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X, Upload, Edit2 } from "lucide-react";
import SimplePhotoEditor from "./simple-photo-editor";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyId: number;
}

// Utiliser une structure simple pour éviter les problèmes de types
interface FileWithPreview {
  file: File;
  id: string;
  preview: string;
  caption: string;
  edited?: boolean;
  editedPreview?: string;
}

export default function UploadModal({ isOpen, onClose, familyId }: UploadModalProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [currentEditFileId, setCurrentEditFileId] = useState<string | null>(null);
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Check if adding these files would exceed the limit
    if (files.length + acceptedFiles.length > 28) {
      toast({
        title: "הגעת למגבלת התמונות",
        description: "ניתן להעלות עד 28 תמונות לחודש",
        variant: "destructive",
      });
      return;
    }
    
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(2),
      preview: URL.createObjectURL(file),
      caption: "",
    }));
    
    setFiles((prev) => [...prev, ...newFiles]);
  }, [files.length, toast]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [],
      "image/png": [],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
  });
  
  const removeFile = (id: string) => {
    setFiles(files.filter(file => file.id !== id));
  };
  
  const updateCaption = (id: string, caption: string) => {
    setFiles(prevFiles => 
      prevFiles.map(fileObj => 
        fileObj.id === id 
          ? { ...fileObj, caption } 
          : fileObj
      )
    );
  };
  
  const uploadMutation = useMutation({
    mutationFn: async () => {
      // Upload one file at a time instead of in parallel
      const results = [];
      for (const fileObj of files) {
        try {
          console.log("Processing file:", fileObj.file.name);
          
          // Create a new FormData for each file
          const formData = new FormData();
          formData.append("file", fileObj.file);
          // Assurons-nous que la légende est bien encodée et gérée
          console.log("Caption before append:", fileObj.caption || "");
          const safeCaption = fileObj.caption || "";
          formData.append("caption", safeCaption);
          formData.append("familyId", familyId.toString());
          
          console.log("Uploading file:", fileObj.file.name, "Size:", fileObj.file.size);
          
          // Utilisons l'endpoint normal après avoir corrigé le problème
          // Utilisons fetch au lieu de XHR pour une meilleure lisibilité
          const response = await fetch("/api/photos/upload", {
            method: "POST",
            body: formData,
            credentials: "include"
          });
          
          let result;
          if (response.ok) {
            try {
              result = await response.json();
              console.log("Upload successful response:", result);
            } catch (e) {
              console.log("Parse error but successful status", e);
              result = { success: true };
            }
          } else {
            let errorMessage;
            try {
              const errorData = await response.json();
              console.error("Upload failed:", response.status, errorData);
              errorMessage = errorData.message || `Upload failed with status ${response.status}`;
            } catch (e) {
              console.error("Upload failed:", response.status, response.statusText);
              errorMessage = response.statusText || `Upload failed with status ${response.status}`;
            }
            throw new Error(errorMessage);
          }
          
          results.push(result);
        } catch (error) {
          console.error("Error uploading file:", error);
          throw error;
        }
      }
      
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/families/${familyId}/photos`] });
      toast({
        title: "התמונות הועלו בהצלחה",
        description: `${files.length} תמונות הועלו לגזטה המשפחתית`,
      });
      setFiles([]);
      onClose();
    },
    onError: (error) => {
      toast({
        title: "שגיאה בהעלאת התמונות",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Utiliser startTransition pour l'envoi du formulaire pour éviter la suspension
  const [startTransition] = useTransition();

  const handleSubmit = () => {
    if (files.length === 0) {
      toast({
        title: "אין תמונות להעלאה",
        description: "נא להוסיף לפחות תמונה אחת",
        variant: "destructive",
      });
      return;
    }
    
    startTransition(() => {
      uploadMutation.mutate();
    });
  };
  
  // Clean up previews when modal closes
  const cleanUp = () => {
    files.forEach(file => URL.revokeObjectURL(file.preview));
    onClose();
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + "B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + "KB";
    return (bytes / (1024 * 1024)).toFixed(1) + "MB";
  };

  // Fonction pour ouvrir l'éditeur de photo
  const openPhotoEditor = (fileId: string) => {
    setCurrentEditFileId(fileId);
    setIsPhotoEditorOpen(true);
  };

  // Fonction pour gérer la sauvegarde de l'image éditée
  const handlePhotoSave = (editedImageUrl: string, caption: string) => {
    if (!currentEditFileId) return;

    // Mettre à jour le fichier avec l'image éditée
    setFiles(prevFiles => 
      prevFiles.map(fileObj => 
        fileObj.id === currentEditFileId
          ? { 
              ...fileObj, 
              caption, 
              editedPreview: editedImageUrl,
              edited: true
            } 
          : fileObj
      )
    );

    // Convertir l'image éditée en Blob et mise à jour du fichier pour l'upload
    console.log("Conversion de l'image éditée pour le nouveau système de fichiers");
    fetch(editedImageUrl)
      .then(res => res.blob())
      .then(blob => {
        // Créer un nouveau File avec le contenu édité
        const filename = `edited_${Date.now()}.jpg`;
        console.log("Création du nouveau fichier:", filename);
        const file = new File([blob], filename, { 
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        
        // Mettre à jour la collection de fichiers
        setFiles(prevFiles => 
          prevFiles.map(fileObj => 
            fileObj.id === currentEditFileId
              ? { ...fileObj, file } 
              : fileObj
          )
        );
      })
      .catch(err => {
        console.error("Erreur lors de la conversion de l'image éditée:", err);
        toast({
          title: "Erreur",
          description: "Impossible de sauvegarder l'image éditée.",
          variant: "destructive",
        });
      });

    // Fermer l'éditeur de photo
    setIsPhotoEditorOpen(false);
    setCurrentEditFileId(null);
  };

  // Fonction pour fermer l'éditeur de photo
  const handlePhotoEditorClose = () => {
    setIsPhotoEditorOpen(false);
    setCurrentEditFileId(null);
  };
  
  return (
    <>
      {/* Éditeur de photos modal */}
      {isPhotoEditorOpen && currentEditFileId && (
        <SimplePhotoEditor
          isOpen={isPhotoEditorOpen}
          onClose={handlePhotoEditorClose}
          imageUrl={
            files.find(f => f.id === currentEditFileId)?.editedPreview || 
            files.find(f => f.id === currentEditFileId)?.preview || ""
          }
          initialCaption={files.find(f => f.id === currentEditFileId)?.caption || ""}
          onSave={handlePhotoSave}
        />
      )}
      
      {/* Modal principal d'upload */}
      <Dialog open={isOpen} onOpenChange={cleanUp}>
        <DialogContent className="max-w-3xl w-full max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl">העלאת תמונות לגזטה</DialogTitle>
            <Button variant="ghost" size="icon" onClick={cleanUp} className="absolute top-4 right-4">
              <X className="h-6 w-6" />
            </Button>
          </DialogHeader>
        
        <div className="overflow-y-auto max-h-[70vh] p-4">
          {/* Upload Zone */}
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed border-neutral-200 rounded-lg p-8 text-center mb-6 cursor-pointer ${isDragActive ? 'bg-blue-50 border-blue-300' : ''}`}
          >
            <input {...getInputProps()} />
            <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <h4 className="font-bold text-lg mb-2">גרור תמונות לכאן</h4>
            <p className="text-gray-500 mb-4">או</p>
            <Button>בחר תמונות</Button>
            <p className="text-sm text-gray-500 mt-4">
              מותר להעלות עד 28 תמונות בחודש. התמונות יופיעו בגזטה לפי סדר ההעלאה.
            </p>
          </div>
          
          {/* Uploaded Photos */}
          {files.length > 0 && (
            <div className="mb-6">
              <h4 className="font-bold text-lg mb-3">תמונות שהועלו ({files.length}/28)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {files.map((file) => (
                  <div key={file.id} className="border border-neutral-200 rounded-lg p-2 bg-gray-50">
                    <div className="aspect-square mb-2 bg-neutral-200 rounded overflow-hidden relative group">
                      <img 
                        src={file.editedPreview || file.preview} 
                        alt="תמונה שהועלתה" 
                        className="w-full h-full object-cover"
                        onLoad={() => {
                          if (!file.editedPreview) {
                            URL.revokeObjectURL(file.preview);
                          }
                        }}
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80"
                        onClick={() => openPhotoEditor(file.id)}
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
                      {file.edited && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                          Modifiée
                        </div>
                      )}
                    </div>
                    <Textarea
                      className="w-full p-2 text-sm"
                      placeholder="הוסף כיתוב לתמונה..."
                      rows={2}
                      value={file.caption || ""}
                      onChange={(e) => updateCaption(file.id, e.target.value)}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        className="text-red-500 hover:text-red-700 p-0"
                      >
                        הסר
                      </Button>
                      <span className="text-xs text-gray-500">{formatFileSize(file.file.size)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={cleanUp}>ביטול</Button>
          <Button 
            onClick={handleSubmit}
            disabled={files.length === 0 || uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                מעלה...
              </>
            ) : "שמור"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
