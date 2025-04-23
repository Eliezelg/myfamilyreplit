import { useState } from "react";
import { Family } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Users,
  Home as HomeIcon,
  ChevronRight,
  Calendar,
  Image,
  FileText
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { useAdminDashboard } from "@/hooks/use-admin-dashboard";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AdminFamiliesProps = {
  families: Family[];
  isLoading: boolean;
};

export default function AdminFamilies({ 
  families, 
  isLoading 
}: AdminFamiliesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFamilyId, setSelectedFamilyId] = useState<number | null>(null);
  const { getFamilyDetails } = useAdminDashboard();
  
  const { data: selectedFamily, isLoading: isLoadingFamily } = 
    getFamilyDetails(selectedFamilyId || 0);

  const filteredFamilies = families.filter((family) =>
    family.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format de date localisé
  const formatDate = (dateString?: string | Date | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestion des familles</h1>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher..."
            className="w-64 pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/50">
          <CardTitle>Familles ({filteredFamilies.length})</CardTitle>
          <CardDescription>
            Liste de toutes les familles enregistrées sur la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFamilies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                      Aucune famille trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFamilies.map((family) => (
                    <TableRow key={family.id}>
                      <TableCell className="font-medium">{family.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {family.imageUrl ? (
                            <img
                              src={family.imageUrl}
                              alt={family.name}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                              <HomeIcon className="h-4 w-4" />
                            </div>
                          )}
                          <div className="font-medium">{family.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(family.createdAt)}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedFamilyId(family.id)}
                            >
                              Détails <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Détails de la famille: {family.name}</DialogTitle>
                              <DialogDescription>
                                Informations détaillées sur cette famille et ses membres
                              </DialogDescription>
                            </DialogHeader>
                            
                            {isLoadingFamily ? (
                              <div className="flex justify-center items-center p-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                              </div>
                            ) : selectedFamily ? (
                              <div className="mt-4 space-y-4">
                                <div className="flex items-center gap-4">
                                  {selectedFamily.imageUrl ? (
                                    <img
                                      src={selectedFamily.imageUrl}
                                      alt={selectedFamily.name}
                                      className="h-16 w-16 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                      <HomeIcon className="h-8 w-8" />
                                    </div>
                                  )}
                                  <div>
                                    <h3 className="text-xl font-bold">{selectedFamily.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                      Créée le {formatDate(selectedFamily.createdAt)}
                                    </p>
                                  </div>
                                </div>
                                
                                <Tabs defaultValue="members">
                                  <TabsList>
                                    <TabsTrigger value="members">
                                      <Users className="h-4 w-4 mr-2" />
                                      Membres ({selectedFamily.members?.length || 0})
                                    </TabsTrigger>
                                    <TabsTrigger value="stats">
                                      <FileText className="h-4 w-4 mr-2" />
                                      Statistiques
                                    </TabsTrigger>
                                  </TabsList>
                                  
                                  <TabsContent value="members" className="mt-4">
                                    <Card>
                                      <CardContent className="p-0">
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead>Utilisateur</TableHead>
                                              <TableHead>Rôle</TableHead>
                                              <TableHead>A rejoint le</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {selectedFamily.members?.length === 0 ? (
                                              <TableRow>
                                                <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                                                  Aucun membre dans cette famille
                                                </TableCell>
                                              </TableRow>
                                            ) : (
                                              selectedFamily.members?.map((member) => (
                                                <TableRow key={member.id}>
                                                  <TableCell>
                                                    <div className="flex items-center gap-2">
                                                      {member.user?.profileImage ? (
                                                        <img
                                                          src={member.user.profileImage}
                                                          alt={member.user.fullName}
                                                          className="h-8 w-8 rounded-full object-cover"
                                                        />
                                                      ) : (
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                                          <Users className="h-4 w-4" />
                                                        </div>
                                                      )}
                                                      <div>
                                                        <div className="font-medium">{member.user?.fullName}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                          {member.user?.email}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </TableCell>
                                                  <TableCell>
                                                    <Badge variant={
                                                      member.role === "admin" ? "default" : "secondary"
                                                    }>
                                                      {member.role}
                                                    </Badge>
                                                  </TableCell>
                                                  <TableCell>{formatDate(member.joinedAt)}</TableCell>
                                                </TableRow>
                                              ))
                                            )}
                                          </TableBody>
                                        </Table>
                                      </CardContent>
                                    </Card>
                                  </TabsContent>
                                  
                                  <TabsContent value="stats" className="mt-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <Card>
                                        <CardHeader className="pb-2">
                                          <CardTitle className="text-sm font-medium">Photos</CardTitle>
                                        </CardHeader>
                                        <CardContent className="py-0">
                                          <div className="flex items-center">
                                            <Image className="h-5 w-5 mr-2 text-muted-foreground" />
                                            <span className="text-2xl font-bold">
                                              {selectedFamily.stats?.photoCount || 0}
                                            </span>
                                          </div>
                                        </CardContent>
                                      </Card>
                                      
                                      <Card>
                                        <CardHeader className="pb-2">
                                          <CardTitle className="text-sm font-medium">Événements</CardTitle>
                                        </CardHeader>
                                        <CardContent className="py-0">
                                          <div className="flex items-center">
                                            <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                                            <span className="text-2xl font-bold">
                                              {selectedFamily.stats?.eventCount || 0}
                                            </span>
                                          </div>
                                        </CardContent>
                                      </Card>
                                      
                                      <Card>
                                        <CardHeader className="pb-2">
                                          <CardTitle className="text-sm font-medium">Gazettes</CardTitle>
                                        </CardHeader>
                                        <CardContent className="py-0">
                                          <div className="flex items-center">
                                            <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
                                            <span className="text-2xl font-bold">
                                              {selectedFamily.stats?.gazetteCount || 0}
                                            </span>
                                          </div>
                                        </CardContent>
                                      </Card>
                                      
                                      <Card>
                                        <CardHeader className="pb-2">
                                          <CardTitle className="text-sm font-medium">Membres</CardTitle>
                                        </CardHeader>
                                        <CardContent className="py-0">
                                          <div className="flex items-center">
                                            <Users className="h-5 w-5 mr-2 text-muted-foreground" />
                                            <span className="text-2xl font-bold">
                                              {selectedFamily.members?.length || 0}
                                            </span>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </div>
                                  </TabsContent>
                                </Tabs>
                              </div>
                            ) : (
                              <div className="text-center p-4 text-muted-foreground">
                                Aucune information disponible pour cette famille
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter className="bg-muted/20 border-t px-6 py-3">
          <div className="text-xs text-muted-foreground">
            Les familles sont créées par les utilisateurs et contiennent des membres, des photos, des événements et des gazettes.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}