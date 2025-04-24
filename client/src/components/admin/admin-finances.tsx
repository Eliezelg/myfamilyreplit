import { useState } from "react";
import { FundTransaction, User } from "@shared/schema";
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
import { Loader2, Search, ArrowUp, ArrowDown, CreditCard, User as UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

type TransactionWithUser = FundTransaction & {
  user: User;
};

type FinancialStats = {
  totalDeposits: number;
  totalPayments: number;
  netBalance: number;
  transactionsByMonth: {
    month: string;
    total: number;
  }[];
};

type AdminFinancesProps = {
  transactions: TransactionWithUser[];
  financialStats?: FinancialStats;
  isLoading: boolean;
};

export default function AdminFinances({ 
  transactions, 
  financialStats,
  isLoading 
}: AdminFinancesProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTransactions = Array.isArray(transactions) 
  ? transactions.filter((tx) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (tx.description && tx.description.toLowerCase().includes(searchLower)) ||
        (tx.user && ((tx.user.firstName && tx.user.firstName.toLowerCase().includes(searchLower)) || 
        (tx.user.lastName && tx.user.lastName.toLowerCase().includes(searchLower)))) ||
        (tx.type && tx.type.toLowerCase().includes(searchLower))
      );
    })
  : [];

  // Formater les montants en shekels (ILS)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
    }).format(amount / 100); // Conversion des centimes en shekels
  };

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
    });
  };

  // Données pour le graphique financier
  const pieData = financialStats ? [
    { name: 'Dépôts', value: financialStats.totalDeposits },
    { name: 'Paiements', value: financialStats.totalPayments },
  ] : [];

  const COLORS = ['#10b981', '#ef4444'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Finances</h1>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher une transaction..."
            className="w-64 pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Résumé financier */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Dépôts totaux</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ArrowUp className="h-4 w-4 mr-2 text-emerald-500" />
              <span className="text-2xl font-bold">
                {financialStats ? formatCurrency(financialStats.totalDeposits) : '0 ₪'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paiements totaux</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ArrowDown className="h-4 w-4 mr-2 text-red-500" />
              <span className="text-2xl font-bold">
                {financialStats ? formatCurrency(financialStats.totalPayments) : '0 ₪'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Solde net</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CreditCard className="h-4 w-4 mr-2 text-blue-500" />
              <span className="text-2xl font-bold">
                {financialStats ? formatCurrency(financialStats.netBalance) : '0 ₪'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphique et liste de transactions */}
      <div className="grid gap-6 md:grid-cols-7">
        {/* Graphique */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Répartition financière</CardTitle>
            <CardDescription>
              Distribution des dépôts et paiements
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      innerRadius={40}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Montant']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Liste des transactions */}
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Transactions récentes</CardTitle>
            <CardDescription>
              Historique des dernières transactions
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
                    <TableHead>Type</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                        Aucune transaction trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.slice(0, 6).map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <Badge variant={
                            tx.type === "deposit" ? "outline" : 
                            tx.type === "payment" ? "destructive" : 
                            "secondary"
                          }>
                            {tx.type === "deposit" && (
                              <ArrowUp className="h-3 w-3 mr-1 inline" />
                            )}
                            {tx.type === "payment" && (
                              <ArrowDown className="h-3 w-3 mr-1 inline" />
                            )}
                            {tx.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {tx.user.profileImage ? (
                              <img
                                src={tx.user.profileImage}
                                alt={`${tx.user.firstName || ''} ${tx.user.lastName || ''}`}
                                className="h-6 w-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                                <UserIcon className="h-3 w-3" />
                              </div>
                            )}
                            <span className="text-sm">{tx.user.firstName} {tx.user.lastName}</span>
                          </div>
                        </TableCell>
                        <TableCell className={
                          tx.type === "deposit" ? "text-emerald-600 font-medium" : 
                          tx.type === "payment" ? "text-red-600 font-medium" : 
                          ""
                        }>
                          {tx.type === "deposit" ? "+" : "-"}{formatCurrency(tx.amount)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(tx.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
          <div className="p-4 text-center border-t">
            <Button variant="ghost" size="sm">
              Voir toutes les transactions
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}