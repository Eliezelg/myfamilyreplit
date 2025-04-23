import { useState } from "react";
import { Search, Plus, Edit, Trash2, Check, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAdminDashboard } from "@/hooks/use-admin-dashboard";

// Type pour les codes promo
type PromoCode = {
  id: number;
  code: string;
  discount: string;
  type: string;
  description?: string;
  maxUses?: number;
  usesCount: number;
  isActive: boolean;
  startDate: string;
  endDate?: string;
  createdBy?: number;
  createdAt: string;
  creator?: {
    id: number;
    username: string;
    fullName: string;
  };
  subscriptions?: any[];
};

// Schéma de validation pour le formulaire
const promoCodeSchema = z.object({
  code: z.string().min(3, "Le code doit avoir au moins 3 caractères"),
  type: z.enum(["lifetime", "percentage", "fixed"]),
  discount: z.string().refine((val) => !isNaN(parseFloat(val)), {
    message: "Le discount doit être un nombre valide",
  }),
  description: z.string().optional(),
  maxUses: z.union([
    z.string().refine(val => val === "" || !isNaN(parseInt(val)), {
      message: "Le nombre d'utilisations doit être un nombre valide",
    }).transform(val => val === "" ? undefined : parseInt(val)),
    z.number().optional(),
  ]),
  isActive: z.boolean().default(true),
  startDate: z.string(),
  endDate: z.string().optional(),
});

type PromoCodeFormValues = z.infer<typeof promoCodeSchema>;

type AdminPromoCodesProps = {
  promoCodes: PromoCode[];
  isLoading: boolean;
};

export default function AdminPromoCodes({ 
  promoCodes,
  isLoading 
}: AdminPromoCodesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPromoCode, setSelectedPromoCode] = useState<PromoCode | null>(null);
  
  const { toast } = useToast();
  const { 
    createPromoCodeMutation, 
    updatePromoCodeMutation,
    togglePromoCodeStatusMutation,
    deletePromoCodeMutation
  } = useAdminDashboard();

  // Formulaire de création
  const createForm = useForm<PromoCodeFormValues>({
    resolver: zodResolver(promoCodeSchema),
    defaultValues: {
      code: "",
      type: "lifetime",
      discount: "50",
      description: "",
      maxUses: undefined,
      isActive: true,
      startDate: new Date().toISOString().split('T')[0],
      endDate: undefined,
    }
  });

  // Formulaire d'édition
  const editForm = useForm<PromoCodeFormValues>({
    resolver: zodResolver(promoCodeSchema),
    defaultValues: {
      code: "",
      type: "lifetime",
      discount: "50",
      description: "",
      maxUses: undefined,
      isActive: true,
      startDate: new Date().toISOString().split('T')[0],
      endDate: undefined,
    }
  });

  // Filtrer les codes promo selon le terme de recherche
  const filteredPromoCodes = promoCodes?.filter((code) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      code.code.toLowerCase().includes(searchLower) ||
      code.description?.toLowerCase().includes(searchLower) ||
      code.type.toLowerCase().includes(searchLower)
    );
  }) || [];

  // Formatter les dates
  const formatDate = (dateString?: string | Date | null) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy", { locale: fr });
    } catch {
      return "N/A";
    }
  };

  // Ouvrir la boîte de dialogue de création
  const openCreateDialog = () => {
    createForm.reset({
      code: "",
      type: "lifetime",
      discount: "50",
      description: "",
      maxUses: undefined,
      isActive: true,
      startDate: new Date().toISOString().split('T')[0],
      endDate: undefined,
    });
    setIsCreateDialogOpen(true);
  };

  // Ouvrir la boîte de dialogue d'édition
  const openEditDialog = (code: PromoCode) => {
    setSelectedPromoCode(code);
    editForm.reset({
      code: code.code,
      type: code.type as "lifetime" | "percentage" | "fixed",
      discount: code.discount.toString(),
      description: code.description || "",
      maxUses: code.maxUses,
      isActive: code.isActive,
      startDate: new Date(code.startDate).toISOString().split('T')[0],
      endDate: code.endDate ? new Date(code.endDate).toISOString().split('T')[0] : undefined,
    });
    setIsEditDialogOpen(true);
  };

  // Ouvrir la boîte de dialogue de suppression
  const openDeleteDialog = (code: PromoCode) => {
    setSelectedPromoCode(code);
    setIsDeleteDialogOpen(true);
  };

  // Gérer la création d'un code promo
  const handleCreatePromoCode = (data: PromoCodeFormValues) => {
    createPromoCodeMutation.mutate(data, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        toast({
          title: "Code promo créé",
          description: "Le code promo a été créé avec succès",
        });
      }
    });
  };

  // Gérer la mise à jour d'un code promo
  const handleUpdatePromoCode = (data: PromoCodeFormValues) => {
    if (!selectedPromoCode) return;

    updatePromoCodeMutation.mutate(
      { id: selectedPromoCode.id, data },
      {
        onSuccess: () => {
          setIsEditDialogOpen(false);
          toast({
            title: "Code promo mis à jour",
            description: "Le code promo a été mis à jour avec succès",
          });
        }
      }
    );
  };

  // Gérer la suppression d'un code promo
  const handleDeletePromoCode = () => {
    if (!selectedPromoCode) return;

    deletePromoCodeMutation.mutate(selectedPromoCode.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        toast({
          title: "Code promo supprimé",
          description: "Le code promo a été supprimé avec succès",
        });
      }
    });
  };

  // Basculer le statut actif/inactif
  const handleToggleStatus = (code: PromoCode) => {
    togglePromoCodeStatusMutation.mutate(code.id, {
      onSuccess: () => {
        toast({
          title: code.isActive ? "Code promo désactivé" : "Code promo activé",
          description: `Le code promo a été ${code.isActive ? "désactivé" : "activé"} avec succès`,
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Codes promotionnels</h1>
        <div className="flex space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher un code..."
              className="w-64 pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau code
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Liste des codes promo</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Réduction</TableHead>
                  <TableHead>Utilisation</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPromoCodes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      Aucun code promo trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPromoCodes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell className="font-medium">{code.code}</TableCell>
                      <TableCell>
                        {code.type === 'lifetime' && 'À vie (50₪)'}
                        {code.type === 'percentage' && 'Pourcentage'}
                        {code.type === 'fixed' && 'Montant fixe'}
                      </TableCell>
                      <TableCell>
                        {code.type === 'lifetime' && '50₪ prix fixe'}
                        {code.type === 'percentage' && `${code.discount}%`}
                        {code.type === 'fixed' && `${code.discount}₪`}
                      </TableCell>
                      <TableCell>
                        {code.usesCount} {code.maxUses ? `/ ${code.maxUses}` : ''}
                      </TableCell>
                      <TableCell>
                        <div>Du {formatDate(code.startDate)}</div>
                        {code.endDate && <div>Au {formatDate(code.endDate)}</div>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={code.isActive ? "default" : "outline"}>
                          {code.isActive ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleStatus(code)}
                            title={code.isActive ? "Désactiver" : "Activer"}
                          >
                            {code.isActive ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(code)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(code)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              {filteredPromoCodes.length} codes au total
            </div>
          </CardFooter>
        </Card>
      )}

      {/* Boîte de dialogue de création */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Créer un nouveau code promo</DialogTitle>
            <DialogDescription>
              Complétez le formulaire pour créer un nouveau code promo
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreatePromoCode)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: PROMO2025" />
                    </FormControl>
                    <FormDescription>
                      Le code que les utilisateurs saisiront
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de réduction</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="lifetime">Abonnement à vie (50₪)</SelectItem>
                        <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                        <SelectItem value="fixed">Montant fixe (₪)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Type de réduction appliquée
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="discount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant de réduction</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        placeholder={
                          createForm.watch("type") === "lifetime" ? "50" :
                          createForm.watch("type") === "percentage" ? "10" : "5"
                        }
                        disabled={createForm.watch("type") === "lifetime"}
                      />
                    </FormControl>
                    <FormDescription>
                      {createForm.watch("type") === "lifetime" && "Prix fixe de 50₪ pour l'abonnement à vie"}
                      {createForm.watch("type") === "percentage" && "Pourcentage de réduction"}
                      {createForm.watch("type") === "fixed" && "Montant en shekels (₪)"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Description du code promo" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de début</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de fin (optionnel)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value || undefined)}
                          type="date" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createForm.control}
                name="maxUses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre max d'utilisations (optionnel)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || undefined)}
                        type="number" 
                        min="0"
                      />
                    </FormControl>
                    <FormDescription>
                      Laissez vide pour illimité
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Actif</FormLabel>
                      <FormDescription>
                        Cochez pour rendre ce code promo utilisable immédiatement
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={createPromoCodeMutation.isPending}
                >
                  {createPromoCodeMutation.isPending ? (
                    <>
                      <span className="animate-spin mr-2">◌</span>
                      Création...
                    </>
                  ) : (
                    "Créer le code"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Boîte de dialogue d'édition */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Modifier le code promo</DialogTitle>
            <DialogDescription>
              Modifiez les informations du code promo
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdatePromoCode)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: PROMO2025" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de réduction</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="lifetime">Abonnement à vie (50₪)</SelectItem>
                        <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                        <SelectItem value="fixed">Montant fixe (₪)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="discount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant de réduction</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        placeholder={
                          editForm.watch("type") === "lifetime" ? "50" :
                          editForm.watch("type") === "percentage" ? "10" : "5"
                        }
                        disabled={editForm.watch("type") === "lifetime"}
                      />
                    </FormControl>
                    <FormDescription>
                      {editForm.watch("type") === "lifetime" && "Prix fixe de 50₪ pour l'abonnement à vie"}
                      {editForm.watch("type") === "percentage" && "Pourcentage de réduction"}
                      {editForm.watch("type") === "fixed" && "Montant en shekels (₪)"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Description du code promo" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de début</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de fin (optionnel)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value || undefined)}
                          type="date" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="maxUses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre max d'utilisations (optionnel)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || undefined)}
                        type="number" 
                        min="0"
                      />
                    </FormControl>
                    <FormDescription>
                      Laissez vide pour illimité
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Actif</FormLabel>
                      <FormDescription>
                        Cochez pour rendre ce code promo utilisable
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={updatePromoCodeMutation.isPending}
                >
                  {updatePromoCodeMutation.isPending ? (
                    <>
                      <span className="animate-spin mr-2">◌</span>
                      Mise à jour...
                    </>
                  ) : (
                    "Enregistrer"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Boîte de dialogue de suppression */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Supprimer le code promo</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce code promo? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          {selectedPromoCode && (
            <div className="py-4">
              <p><strong>Code:</strong> {selectedPromoCode.code}</p>
              <p><strong>Type:</strong> {
                selectedPromoCode.type === 'lifetime' ? 'Abonnement à vie' :
                selectedPromoCode.type === 'percentage' ? 'Pourcentage' :
                'Montant fixe'
              }</p>
              <p><strong>Utilisations:</strong> {selectedPromoCode.usesCount}</p>
            </div>
          )}
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              onClick={handleDeletePromoCode}
              disabled={deletePromoCodeMutation.isPending}
            >
              {deletePromoCodeMutation.isPending ? (
                <>
                  <span className="animate-spin mr-2">◌</span>
                  Suppression...
                </>
              ) : (
                "Supprimer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}