import { useEffect, useRef, useState } from "react";
import fabric from "fabric";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Bold,
  Italic,
  Underline,
  Circle,
  Square,
  Type,
  Image as ImageIcon,
  Smile,
  X,
  Undo,
  Redo,
  Save,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  MessageSquare,
  RotateCcw,
  RotateCw,
  Crop,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  MoveHorizontal,
  Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface PhotoEditorProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onSave: (editedImageUrl: string, caption: string) => void;
  initialCaption?: string;
}

// Options pour les bulles de texte
const BUBBLE_STYLES = [
  { name: "Ronde", value: "round" },
  { name: "Rectangle", value: "rectangle" },
  { name: "Ovale", value: "oval" },
  { name: "Dialogue", value: "speech" },
];

// Options pour les polices
const FONT_FAMILIES = [
  { name: "Arial", value: "Arial" },
  { name: "Helvetica", value: "Helvetica" },
  { name: "Times New Roman", value: "Times New Roman" },
  { name: "Comic Sans MS", value: "Comic Sans MS" },
  { name: "Impact", value: "Impact" },
];

// Options pour les filtres
const FILTERS = [
  { name: "Normal", value: "normal" },
  { name: "Noir et Blanc", value: "grayscale" },
  { name: "Sépia", value: "sepia" },
  { name: "Inversion", value: "invert" },
  { name: "Vintage", value: "vintage" },
];

export default function PhotoEditor({
  isOpen,
  onClose,
  imageUrl,
  onSave,
  initialCaption = "",
}: PhotoEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const originalImageRef = useRef<fabric.Image | null>(null);
  const [caption, setCaption] = useState(initialCaption);
  const [activeTab, setActiveTab] = useState("edit");
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [textOptions, setTextOptions] = useState({
    fontFamily: "Arial",
    fontSize: 24,
    fontWeight: "normal",
    fontStyle: "normal",
    textDecoration: "none",
    textAlign: "left",
    fill: "#000000",
  });
  const [imageOptions, setImageOptions] = useState({
    angle: 0,
    zoom: 1,
    brightness: 0,
    contrast: 0,
    filter: "normal",
  });
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isCropping, setIsCropping] = useState(false);
  const [cropRect, setCropRect] = useState<fabric.Rect | null>(null);
  const { toast } = useToast();

  // Initialiser le canvas Fabric.js quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && canvasRef.current) {
      // Créer le canvas Fabric.js
      fabricCanvasRef.current = new fabric.Canvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: "#f0f0f0",
      });

      // Charger l'image
      fabric.Image.fromURL(imageUrl, (img: any) => {
        // Sauvegarde l'image originale pour les manipulations
        originalImageRef.current = img;
        
        // Redimensionner l'image pour qu'elle tienne dans le canvas
        const canvasWidth = fabricCanvasRef.current?.getWidth() || 800;
        const canvasHeight = fabricCanvasRef.current?.getHeight() || 600;
        
        const scale = Math.min(
          canvasWidth / img.width!,
          canvasHeight / img.height!
        );
        
        img.scale(scale);
        img.set({
          left: (canvasWidth - img.width! * scale) / 2,
          top: (canvasHeight - img.height! * scale) / 2,
          selectable: true, // L'image est maintenant sélectionnable pour pouvoir la retoucher
          name: 'mainImage'
        });
        
        fabricCanvasRef.current?.add(img);
        fabricCanvasRef.current?.setActiveObject(img);
        fabricCanvasRef.current?.renderAll();
        
        // Initialiser l'historique
        saveToHistory();
      });

      // Gérer la sélection d'objets
      fabricCanvasRef.current.on("selection:created", handleSelectionChange);
      fabricCanvasRef.current.on("selection:updated", handleSelectionChange);
      fabricCanvasRef.current.on("selection:cleared", () => setSelectedObject(null));

      // Gérer les modifications pour l'historique
      fabricCanvasRef.current.on("object:modified", saveToHistory);
      fabricCanvasRef.current.on("object:added", saveToHistory);
      fabricCanvasRef.current.on("object:removed", saveToHistory);
    }

    // Nettoyer le canvas quand le modal se ferme
    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [isOpen, imageUrl]);

  // Gérer la sélection d'objets
  const handleSelectionChange = (e: any) => {
    const selectedObj = fabricCanvasRef.current?.getActiveObject();
    setSelectedObject(selectedObj || null);

    // Mettre à jour les options de texte si c'est un objet texte
    if (selectedObj && selectedObj.type === "textbox") {
      const textbox = selectedObj as fabric.Textbox;
      setTextOptions({
        fontFamily: textbox.fontFamily || "Arial",
        fontSize: textbox.fontSize || 24,
        fontWeight: textbox.fontWeight as string || "normal",
        fontStyle: textbox.fontStyle || "normal",
        textDecoration: textbox.textDecoration || "none",
        textAlign: textbox.textAlign || "left",
        fill: textbox.fill as string || "#000000",
      });
    }

    // Mettre à jour les options d'image si c'est l'image principale
    if (selectedObj && selectedObj.type === "image" && selectedObj.name === "mainImage") {
      setImageOptions({
        angle: selectedObj.angle || 0,
        zoom: selectedObj.scaleX || 1,
        brightness: 0, // À calculer si nécessaire
        contrast: 0,   // À calculer si nécessaire
        filter: "normal",
      });
    }
  };

  // Gérer l'historique
  const saveToHistory = () => {
    if (!fabricCanvasRef.current) return;
    
    const json = JSON.stringify(fabricCanvasRef.current.toJSON());
    
    // Supprimer les états futurs si on a fait des modifications après un undo
    if (historyIndex < history.length - 1) {
      setHistory(history.slice(0, historyIndex + 1));
    }
    
    setHistory(prev => [...prev, json]);
    setHistoryIndex(prev => prev + 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      loadFromHistory(newIndex);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      loadFromHistory(newIndex);
    }
  };

  const loadFromHistory = (index: number) => {
    if (!fabricCanvasRef.current || !history[index]) return;
    
    fabricCanvasRef.current.loadFromJSON(JSON.parse(history[index]), () => {
      fabricCanvasRef.current?.renderAll();
    });
  };

  // Fonctions d'édition
  const addText = () => {
    if (!fabricCanvasRef.current) return;
    
    const text = new fabric.Textbox("Cliquez pour modifier", {
      left: 50,
      top: 50,
      fontFamily: textOptions.fontFamily,
      fontSize: textOptions.fontSize,
      fill: textOptions.fill,
      width: 300,
    });
    
    fabricCanvasRef.current.add(text);
    fabricCanvasRef.current.setActiveObject(text);
    fabricCanvasRef.current.renderAll();
    saveToHistory();
  };

  const addEmoji = (emoji: string) => {
    if (!fabricCanvasRef.current) return;
    
    const text = new fabric.Text(emoji, {
      left: 50,
      top: 50,
      fontSize: 40,
    });
    
    fabricCanvasRef.current.add(text);
    fabricCanvasRef.current.setActiveObject(text);
    fabricCanvasRef.current.renderAll();
    saveToHistory();
  };

  const addBubble = (type: string) => {
    if (!fabricCanvasRef.current) return;
    
    let bubble: fabric.Object;
    
    switch (type) {
      case "round":
        bubble = new fabric.Circle({
          left: 50,
          top: 50,
          radius: 50,
          fill: "rgba(255, 255, 255, 0.7)",
          stroke: "#000000",
          strokeWidth: 2,
        });
        break;
      case "rectangle":
        bubble = new fabric.Rect({
          left: 50,
          top: 50,
          width: 200,
          height: 100,
          fill: "rgba(255, 255, 255, 0.7)",
          stroke: "#000000",
          strokeWidth: 2,
          rx: 10,
          ry: 10,
        });
        break;
      case "oval":
        bubble = new fabric.Ellipse({
          left: 50,
          top: 50,
          rx: 100,
          ry: 50,
          fill: "rgba(255, 255, 255, 0.7)",
          stroke: "#000000",
          strokeWidth: 2,
        });
        break;
      case "speech":
        // Créer une bulle de dialogue (forme personnalisée)
        const path = new fabric.Path("M 0 0 L 200 0 L 200 100 L 50 100 L 25 125 L 25 100 L 0 100 L 0 0 z", {
          left: 50,
          top: 50,
          fill: "rgba(255, 255, 255, 0.7)",
          stroke: "#000000",
          strokeWidth: 2,
        });
        bubble = path;
        break;
      default:
        bubble = new fabric.Rect({
          left: 50,
          top: 50,
          width: 200,
          height: 100,
          fill: "rgba(255, 255, 255, 0.7)",
          stroke: "#000000",
          strokeWidth: 2,
        });
    }
    
    fabricCanvasRef.current.add(bubble);
    fabricCanvasRef.current.setActiveObject(bubble);
    fabricCanvasRef.current.renderAll();
    saveToHistory();
  };

  const updateTextProperty = (property: string, value: any) => {
    const object = fabricCanvasRef.current?.getActiveObject();
    if (!object || (object.type !== "textbox" && object.type !== "text")) return;
    
    if (property !== "textAlign") {
      object.set({ [property]: value } as fabric.IObjectOptions);
    } else {
      (object as fabric.Textbox).set({ textAlign: value });
    }
    
    fabricCanvasRef.current?.renderAll();
    
    setTextOptions(prev => ({
      ...prev,
      [property]: value,
    }));
  };

  const deleteSelectedObject = () => {
    if (!fabricCanvasRef.current) return;
    const activeObject = fabricCanvasRef.current.getActiveObject();
    if (activeObject) {
      fabricCanvasRef.current.remove(activeObject);
      fabricCanvasRef.current.renderAll();
      saveToHistory();
    }
  };

  const handleSave = () => {
    if (!fabricCanvasRef.current) return;
    
    try {
      const dataURL = fabricCanvasRef.current.toDataURL({ format: "jpeg", quality: 0.8 });
      onSave(dataURL, caption);
      toast({
        title: "Image sauvegardée",
        description: "Les modifications ont été appliquées avec succès.",
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

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl">Édition de photo</DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-4 right-4">
            <X className="h-6 w-6" />
          </Button>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Panneau d'outils */}
          <div className="lg:col-span-1 border rounded-md p-4 overflow-y-auto max-h-[60vh]">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="edit" className="flex-1">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Retouche
                </TabsTrigger>
                <TabsTrigger value="text" className="flex-1">
                  <Type className="h-4 w-4 mr-2" />
                  Texte
                </TabsTrigger>
                <TabsTrigger value="emoji" className="flex-1">
                  <Smile className="h-4 w-4 mr-2" />
                  Emoji
                </TabsTrigger>
                <TabsTrigger value="bubble" className="flex-1">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Bulle
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="text" className="space-y-4 mt-4">
                <Button onClick={addText} className="w-full">Ajouter du texte</Button>
                
                {selectedObject && (selectedObject.type === "textbox" || selectedObject.type === "text") && (
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="text-sm font-medium">Police</label>
                      <Select
                        value={textOptions.fontFamily}
                        onValueChange={(value) => updateTextProperty("fontFamily", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Police" />
                        </SelectTrigger>
                        <SelectContent>
                          {FONT_FAMILIES.map((font) => (
                            <SelectItem key={font.value} value={font.value}>
                              {font.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Taille</label>
                      <div className="flex items-center space-x-2">
                        <Slider
                          value={[textOptions.fontSize]}
                          min={8}
                          max={72}
                          step={1}
                          onValueChange={(value) => updateTextProperty("fontSize", value[0])}
                        />
                        <span className="text-sm w-8">{textOptions.fontSize}</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Couleur</label>
                      <Input
                        type="color"
                        value={textOptions.fill}
                        onChange={(e) => updateTextProperty("fill", e.target.value)}
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant={textOptions.fontWeight === "bold" ? "default" : "outline"}
                        size="icon"
                        onClick={() => updateTextProperty("fontWeight", textOptions.fontWeight === "bold" ? "normal" : "bold")}
                      >
                        <Bold className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={textOptions.fontStyle === "italic" ? "default" : "outline"}
                        size="icon"
                        onClick={() => updateTextProperty("fontStyle", textOptions.fontStyle === "italic" ? "normal" : "italic")}
                      >
                        <Italic className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={textOptions.textDecoration === "underline" ? "default" : "outline"}
                        size="icon"
                        onClick={() => updateTextProperty("textDecoration", textOptions.textDecoration === "underline" ? "none" : "underline")}
                      >
                        <Underline className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant={textOptions.textAlign === "left" ? "default" : "outline"}
                        size="icon"
                        onClick={() => updateTextProperty("textAlign", "left")}
                      >
                        <AlignLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={textOptions.textAlign === "center" ? "default" : "outline"}
                        size="icon"
                        onClick={() => updateTextProperty("textAlign", "center")}
                      >
                        <AlignCenter className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={textOptions.textAlign === "right" ? "default" : "outline"}
                        size="icon"
                        onClick={() => updateTextProperty("textAlign", "right")}
                      >
                        <AlignRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="emoji" className="space-y-4 mt-4">
                <div className="max-h-[500px] overflow-y-auto">
                  <Picker 
                    data={data} 
                    onEmojiSelect={(emoji: any) => addEmoji(emoji.native)} 
                    previewPosition="none"
                    theme="light"
                    skinTonePosition="none"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="bubble" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-2">
                  {BUBBLE_STYLES.map((style) => (
                    <Button
                      key={style.value}
                      variant="outline"
                      onClick={() => addBubble(style.value)}
                      className="flex flex-col items-center p-4"
                    >
                      {style.value === "round" && <Circle className="h-8 w-8 mb-2" />}
                      {style.value === "rectangle" && <Square className="h-8 w-8 mb-2" />}
                      {style.value === "oval" && <Circle className="h-8 w-8 mb-2 transform scale-x-150" />}
                      {style.value === "speech" && <MessageSquare className="h-8 w-8 mb-2" />}
                      {style.name}
                    </Button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 space-y-4">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  title="Annuler"
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  title="Rétablir"
                >
                  <Redo className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={deleteSelectedObject}
                  disabled={!selectedObject}
                  title="Supprimer l'élément sélectionné"
                  className="text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div>
                <label className="text-sm font-medium">Légende de l'image</label>
                <Input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Ajouter une légende..."
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          
          {/* Canvas */}
          <div className="lg:col-span-3 overflow-auto flex items-center justify-center bg-gray-100 rounded-md p-2">
            <canvas ref={canvasRef} />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleCancel}>Annuler</Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}