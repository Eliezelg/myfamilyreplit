import { useState, Suspense } from "react";
import { Loader2, Users, Home, PieChart, CreditCard, Clock, Settings, Shield, Tag } from "lucide-react";
import { useAdminDashboard } from "@/hooks/use-admin-dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import AdminUsers from "@/components/admin/admin-users";
import AdminFamilies from "@/components/admin/admin-families";
import AdminFinances from "@/components/admin/admin-finances";
import AdminLogs from "@/components/admin/admin-logs";
import AdminStats from "@/components/admin/admin-stats";
import AdminPromoCodes from "@/components/admin/admin-promo-codes";
// Added import for TransitionWrapper -  assuming this component exists in the project. Adjust path if necessary.
import { TransitionWrapper } from "@/lib/transition-wrapper";


export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const {
    stats,
    isLoadingStats,
    users,
    isLoadingUsers,
    families,
    isLoadingFamilies,
    adminLogs,
    isLoadingLogs,
    transactions,
    isLoadingTransactions,
    financialStats,
    isLoadingFinancialStats,
    promoCodes,
    isLoadingPromoCodes,
    updateUserRoleMutation,
    deleteUserMutation
  } = useAdminDashboard();

  // État de chargement global pour les données principales
  const isLoading = isLoadingStats || isLoadingUsers || isLoadingFamilies;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden w-64 flex-col bg-white shadow-sm p-4 md:flex">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Admin Dashboard</h2>
          <p className="text-muted-foreground">Gestion de la plateforme</p>
        </div>

        <nav className="space-y-1.5">
          <Button
            variant={activeTab === "overview" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("overview")}
          >
            <Home className="mr-2 h-4 w-4" />
            Aperçu général
          </Button>
          <Button
            variant={activeTab === "users" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("users")}
          >
            <Users className="mr-2 h-4 w-4" />
            Utilisateurs
          </Button>
          <Button
            variant={activeTab === "families" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("families")}
          >
            <Home className="mr-2 h-4 w-4" />
            Familles
          </Button>
          <Button
            variant={activeTab === "finances" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("finances")}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Finances
          </Button>
          <Button
            variant={activeTab === "promo-codes" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("promo-codes")}
          >
            <Tag className="mr-2 h-4 w-4" />
            Codes promo
          </Button>
          <Button
            variant={activeTab === "logs" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("logs")}
          >
            <Clock className="mr-2 h-4 w-4" />
            Logs d'activité
          </Button>
          <Button
            variant={activeTab === "settings" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("settings")}
          >
            <Settings className="mr-2 h-4 w-4" />
            Paramètres
          </Button>
        </nav>

        <div className="mt-auto pt-4">
          <a href="/" className="flex items-center text-sm text-muted-foreground hover:text-primary">
            <Shield className="mr-2 h-4 w-4" />
            Retour au site
          </a>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="block md:hidden bg-white shadow-sm p-4 fixed top-0 left-0 right-0 z-10">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Admin Dashboard</h2>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="grid grid-cols-6">
              <TabsTrigger value="overview"><Home className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="users"><Users className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="families"><Home className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="finances"><CreditCard className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="promo-codes"><Tag className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="logs"><Clock className="h-4 w-4" /></TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 md:p-8 p-4 mt-16 md:mt-0">
        <Suspense fallback={<div className="flex items-center justify-center h-[80vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsContent value="overview" className="mt-6">
              <TransitionWrapper fallback={<div className="p-4 text-center">Chargement des statistiques...</div>}>
                <AdminStats stats={stats} financialStats={financialStats} />
              </TransitionWrapper>
            </TabsContent>
            <TabsContent value="users" className="mt-6">
              <TransitionWrapper fallback={<div className="p-4 text-center">Chargement des utilisateurs...</div>}>
                <AdminUsers
                  users={users || []}
                  updateUserRole={(userId, role) => updateUserRoleMutation.mutate({ userId, role })}
                  deleteUser={(userId) => deleteUserMutation.mutate(userId)}
                  isLoading={isLoadingUsers}
                />
              </TransitionWrapper>
            </TabsContent>
            <TabsContent value="families" className="mt-6">
              <TransitionWrapper fallback={<div className="p-4 text-center">Chargement des familles...</div>}>
                <AdminFamilies families={families || []} isLoading={isLoadingFamilies} />
              </TransitionWrapper>
            </TabsContent>
            <TabsContent value="finances" className="mt-6">
              <TransitionWrapper fallback={<div className="p-4 text-center">Chargement des finances...</div>}>
                <AdminFinances
                  transactions={transactions || []}
                  financialStats={financialStats}
                  isLoading={isLoadingTransactions || isLoadingFinancialStats}
                />
              </TransitionWrapper>
            </TabsContent>
            <TabsContent value="promo-codes" className="mt-6">
              <TransitionWrapper fallback={<div className="p-4 text-center">Chargement des codes promo...</div>}>
                <AdminPromoCodes promoCodes={promoCodes || []} isLoading={isLoadingPromoCodes} />
              </TransitionWrapper>
            </TabsContent>
            <TabsContent value="logs" className="mt-6">
              <TransitionWrapper fallback={<div className="p-4 text-center">Chargement des journaux...</div>}>
                <AdminLogs logs={adminLogs || []} isLoading={isLoadingLogs} />
              </TransitionWrapper>
            </TabsContent>
            <TabsContent value="settings" className="mt-6">
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Paramètres du système</CardTitle>
                    <CardDescription>Configuration avancée de la plateforme</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Fonctionnalité à implémenter.</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </Suspense>
      </div>
    </div>
  );
}