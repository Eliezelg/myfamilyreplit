import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Users, Home, Image, CreditCard, TrendingUp, UserPlus } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type StatsProps = {
  stats?: {
    userCount: number;
    familyCount: number;
    childCount: number;
    photoCount: number;
    transactionCount: number;
    totalFunds: number;
    newUsersLastWeek: number;
  };
  financialStats?: {
    totalDeposits: number;
    totalPayments: number;
    netBalance: number;
    transactionsByMonth: {
      month: string;
      total: number;
    }[];
  };
};

export default function AdminStats({ stats, financialStats }: StatsProps) {
  // Formater les montants en shekels (ILS)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
    }).format(amount / 100); // Conversion des centimes en shekels
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Tableau de bord administrateur</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.userCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.newUsersLastWeek || 0} nouveaux cette semaine
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Familles</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.familyCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.childCount || 0} enfants enregistrés
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Photos</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.photoCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Images partagées
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.transactionCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              {financialStats ? formatCurrency(financialStats.netBalance) : '0 ₪'} en solde total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphique financier */}
      {financialStats && financialStats.transactionsByMonth.length > 0 && (
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Activité financière</CardTitle>
            <CardDescription>
              Évolution des transactions sur les 6 derniers mois
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={financialStats.transactionsByMonth}
                margin={{
                  top: 5,
                  right: 10,
                  left: 10,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickFormatter={(value) => {
                    const [year, month] = value.split('-');
                    return `${month}/${year.slice(2)}`;
                  }}
                />
                <YAxis
                  tickFormatter={(value) => 
                    new Intl.NumberFormat('he-IL', {
                      style: 'currency',
                      currency: 'ILS',
                      notation: 'compact',
                      minimumFractionDigits: 0,
                    }).format(value / 100)
                  }
                />
                <Tooltip
                  formatter={(value: number) => [
                    formatCurrency(value),
                    'Montant'
                  ]}
                  labelFormatter={(label) => {
                    const [year, month] = label.split('-');
                    const date = new Date(parseInt(year), parseInt(month) - 1);
                    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
      
      {/* Autres indicateurs */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Dépôts vs Paiements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Dépôts</span>
                <span className="font-medium text-green-600">
                  {financialStats ? formatCurrency(financialStats.totalDeposits) : '0 ₪'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Paiements</span>
                <span className="font-medium text-red-600">
                  {financialStats ? formatCurrency(financialStats.totalPayments) : '0 ₪'}
                </span>
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-sm font-medium">Solde net</span>
                <span className="font-bold">
                  {financialStats ? formatCurrency(financialStats.netBalance) : '0 ₪'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Taux de conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Ratio familles/utilisateurs</span>
                <span className="font-medium">
                  {stats && stats.userCount > 0 
                    ? `${(stats.familyCount / stats.userCount * 100).toFixed(1)}%`
                    : '0%'
                  }
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Utilisateurs avec enfants</span>
                <span className="font-medium">
                  {stats && stats.userCount > 0 
                    ? `${(stats.childCount / stats.userCount * 100).toFixed(1)}%`
                    : '0%'
                  }
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Photos par famille</span>
                <span className="font-medium">
                  {stats && stats.familyCount > 0 
                    ? (stats.photoCount / stats.familyCount).toFixed(1)
                    : '0'
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}