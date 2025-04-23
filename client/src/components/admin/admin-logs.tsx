import { useState } from "react";
import { AdminLog } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Loader2, 
  Search, 
  Eye, 
  Trash2, 
  Edit, 
  Plus,
  User as UserIcon,
  Home as HomeIcon,
  Image,
  FileText,
  CreditCard
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type AdminLogsProps = {
  logs: AdminLog[];
  isLoading: boolean;
};

export default function AdminLogs({ 
  logs, 
  isLoading 
}: AdminLogsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState<AdminLog | null>(null);

  const filteredLogs = logs.filter((log) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(searchLower) ||
      log.entityType.toLowerCase().includes(searchLower) ||
      (log.details && JSON.stringify(log.details).toLowerCase().includes(searchLower))
    );
  });

  // Format de date localisé
  const formatDate = (dateString?: string | Date | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  // Coloration et icône en fonction du type d'action
  const getActionBadge = (action: string) => {
    switch (action) {
      case "create":
        return { 
          color: "bg-green-100 text-green-800", 
          icon: <Plus className="h-3 w-3 mr-1" /> 
        };
      case "update":
        return { 
          color: "bg-blue-100 text-blue-800", 
          icon: <Edit className="h-3 w-3 mr-1" /> 
        };
      case "delete":
        return { 
          color: "bg-red-100 text-red-800", 
          icon: <Trash2 className="h-3 w-3 mr-1" /> 
        };
      case "view":
        return { 
          color: "bg-gray-100 text-gray-800", 
          icon: <Eye className="h-3 w-3 mr-1" /> 
        };
      default:
        return { 
          color: "bg-gray-100 text-gray-800", 
          icon: null 
        };
    }
  };

  // Icône en fonction du type d'entité
  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case "user":
        return <UserIcon className="h-3 w-3 mr-1" />;
      case "family":
        return <HomeIcon className="h-3 w-3 mr-1" />;
      case "photo":
        return <Image className="h-3 w-3 mr-1" />;
      case "transaction":
      case "financial_stats":
        return <CreditCard className="h-3 w-3 mr-1" />;
      case "gazette":
        return <FileText className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Logs d'administration</h1>
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
          <CardTitle>Journaux d'actions ({filteredLogs.length})</CardTitle>
          <CardDescription>
            Historique des actions réalisées par les administrateurs sur la plateforme
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
                  <TableHead>Action</TableHead>
                  <TableHead>Entité</TableHead>
                  <TableHead>ID Entité</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Détails</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                      Aucun log trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => {
                    const { color, icon } = getActionBadge(log.action);
                    const entityIcon = getEntityIcon(log.entityType);
                    
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.id}</TableCell>
                        <TableCell>
                          <Badge className={color} variant="outline">
                            {icon} {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {entityIcon} {log.entityType}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.entityId || "-"}</TableCell>
                        <TableCell>{log.adminId}</TableCell>
                        <TableCell className="text-xs">
                          {formatDate(log.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setSelectedLog(log)}
                              >
                                Voir
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Détails du log #{log.id}</DialogTitle>
                                <DialogDescription>
                                  Information complète sur cette action administrative
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="mt-4 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h3 className="text-sm font-medium mb-1">Action</h3>
                                    <Badge className={color} variant="outline">
                                      {icon} {log.action}
                                    </Badge>
                                  </div>
                                  <div>
                                    <h3 className="text-sm font-medium mb-1">Entité</h3>
                                    <Badge variant="outline">
                                      {entityIcon} {log.entityType}
                                      {log.entityId ? ` #${log.entityId}` : ''}
                                    </Badge>
                                  </div>
                                  <div>
                                    <h3 className="text-sm font-medium mb-1">Admin ID</h3>
                                    <p>{log.adminId}</p>
                                  </div>
                                  <div>
                                    <h3 className="text-sm font-medium mb-1">Adresse IP</h3>
                                    <p>{log.ipAddress || "Non enregistrée"}</p>
                                  </div>
                                  <div>
                                    <h3 className="text-sm font-medium mb-1">Date</h3>
                                    <p>{formatDate(log.createdAt)}</p>
                                  </div>
                                </div>
                                
                                <div>
                                  <h3 className="text-sm font-medium mb-1">Données détaillées</h3>
                                  <Card>
                                    <CardContent className="p-4">
                                      <pre className="text-xs overflow-auto max-h-64">
                                        {log.details 
                                          ? JSON.stringify(log.details, null, 2) 
                                          : "Aucune donnée détaillée"
                                        }
                                      </pre>
                                    </CardContent>
                                  </Card>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}