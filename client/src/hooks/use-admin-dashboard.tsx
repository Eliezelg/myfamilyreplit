import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { User, Family, AdminLog, FundTransaction } from "@shared/schema";
import { useToast } from "./use-toast";

// Types pour le dashboard admin
type DashboardStats = {
  userCount: number;
  familyCount: number;
  childCount: number;
  photoCount: number;
  transactionCount: number;
  totalFunds: number;
  newUsersLastWeek: number;
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

type TransactionWithUser = FundTransaction & {
  user: User;
};

// Hook principal pour le dashboard admin
export function useAdminDashboard() {
  const { toast } = useToast();

  // Statistiques générales
  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError,
  } = useQuery<DashboardStats, Error>({
    queryKey: ["/api/admin/stats"],
    queryFn: getQueryFn({}),
  });

  // Liste des utilisateurs
  const {
    data: users,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery<User[], Error>({
    queryKey: ["/api/admin/users"],
    queryFn: getQueryFn({}),
  });

  // Liste des familles
  const {
    data: families,
    isLoading: isLoadingFamilies,
    error: familiesError,
  } = useQuery<Family[], Error>({
    queryKey: ["/api/admin/families"],
    queryFn: getQueryFn({}),
  });

  // Logs d'administration
  const {
    data: adminLogs,
    isLoading: isLoadingLogs,
    error: logsError,
  } = useQuery<AdminLog[], Error>({
    queryKey: ["/api/admin/logs"],
    queryFn: getQueryFn({}),
  });

  // Transactions financières
  const {
    data: transactions,
    isLoading: isLoadingTransactions,
    error: transactionsError,
  } = useQuery<TransactionWithUser[], Error>({
    queryKey: ["/api/admin/transactions"],
    queryFn: getQueryFn({}),
  });

  // Statistiques financières
  const {
    data: financialStats,
    isLoading: isLoadingFinancialStats,
    error: financialStatsError,
  } = useQuery<FinancialStats, Error>({
    queryKey: ["/api/admin/financial-stats"],
    queryFn: getQueryFn({}),
  });

  // Détails d'une famille
  const getFamilyDetails = (familyId: number) => {
    return useQuery({
      queryKey: ["/api/admin/families", familyId],
      queryFn: getQueryFn(),
    });
  };

  // Mise à jour du rôle d'un utilisateur
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const res = await apiRequest("PUT", `/api/admin/users/${userId}/role`, { role });
      return await res.json();
    },
    onSuccess: () => {
      // Invalider le cache des utilisateurs pour recharger la liste
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Rôle mis à jour",
        description: "Le rôle de l'utilisateur a été mis à jour avec succès",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: `La mise à jour du rôle a échoué: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Suppression d'un utilisateur
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      // Invalider le cache des utilisateurs et des stats pour recharger les données
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Utilisateur supprimé",
        description: "L'utilisateur a été supprimé avec succès",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: `La suppression de l'utilisateur a échoué: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    // Statistiques générales
    stats,
    isLoadingStats,
    statsError,

    // Gestion des utilisateurs
    users,
    isLoadingUsers,
    usersError,
    updateUserRoleMutation,
    deleteUserMutation,

    // Gestion des familles
    families,
    isLoadingFamilies,
    familiesError,
    getFamilyDetails,

    // Logs d'administration
    adminLogs,
    isLoadingLogs,
    logsError,

    // Finances
    transactions,
    isLoadingTransactions,
    transactionsError,
    financialStats,
    isLoadingFinancialStats,
    financialStatsError,
  };
}