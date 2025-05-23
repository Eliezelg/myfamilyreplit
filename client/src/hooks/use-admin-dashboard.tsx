import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { User, Family, AdminLog, FundTransaction, PromoCode } from "@shared/schema";
import { useToast } from "./use-toast";
import { useTransitionEffect } from '../lib/transition-wrapper'; // Added import

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
  const { isPending, runWithTransition } = useTransitionEffect(); // Added

  // Statistiques générales
  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError,
  } = useQuery<DashboardStats, Error>({
    queryKey: ["/api/admin/stats"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Liste des utilisateurs
  const {
    data: users,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery<User[], Error>({
    queryKey: ["/api/admin/users"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Liste des familles
  const {
    data: families,
    isLoading: isLoadingFamilies,
    error: familiesError,
  } = useQuery<Family[], Error>({
    queryKey: ["/api/admin/families"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Logs d'administration
  const {
    data: adminLogs,
    isLoading: isLoadingLogs,
    error: logsError,
  } = useQuery<AdminLog[], Error>({
    queryKey: ["/api/admin/logs"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Transactions financières
  const {
    data: transactions,
    isLoading: isLoadingTransactions,
    error: transactionsError,
  } = useQuery<TransactionWithUser[], Error>({
    queryKey: ["/api/admin/transactions"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Statistiques financières
  const {
    data: financialStats,
    isLoading: isLoadingFinancialStats,
    error: financialStatsError,
  } = useQuery<FinancialStats, Error>({
    queryKey: ["/api/admin/financial-stats"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Liste des codes promo
  const {
    data: promoCodes,
    isLoading: isLoadingPromoCodes,
    error: promoCodesError,
  } = useQuery<PromoCode[], Error>({
    queryKey: ["/api/promo-codes"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Détails d'une famille
  const { 
    data: familyDetailsCache,
    isLoading: isLoadingFamilyDetails
  } = useQuery<Record<number, any>>({
    queryKey: ["/api/admin/families/details"],
    queryFn: () => ({}),
    initialData: {},
  });

  const getFamilyDetails = async (familyId: number): Promise<any> => {
    if (familyId <= 0) return null;

    if (familyDetailsCache[familyId]) {
      return familyDetailsCache[familyId];
    }

    try {
      const response = await fetch(`/api/admin/families/${familyId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch family details');
      }
      const data = await response.json();

      // Update cache
      queryClient.setQueryData(["/api/admin/families/details"], {
        ...familyDetailsCache,
        [familyId]: data
      });

      return data;
    } catch (error) {
      console.error('Error fetching family details:', error);
      return null;
    }
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

  // Création d'un code promo
  const createPromoCodeMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/promo-codes", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promo-codes"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: `La création du code promo a échoué: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mise à jour d'un code promo
  const updatePromoCodeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PUT", `/api/promo-codes/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promo-codes"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: `La mise à jour du code promo a échoué: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Activer/désactiver un code promo
  const togglePromoCodeStatusMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/promo-codes/${id}/toggle`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promo-codes"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: `Le changement du statut du code promo a échoué: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Suppression d'un code promo
  const deletePromoCodeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/promo-codes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promo-codes"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: `La suppression du code promo a échoué: ${error.message}`,
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

    // Gestion des codes promo
    promoCodes,
    isLoadingPromoCodes,
    promoCodesError,
    createPromoCodeMutation,
    updatePromoCodeMutation,
    togglePromoCodeStatusMutation,
    deletePromoCodeMutation,
  };
}