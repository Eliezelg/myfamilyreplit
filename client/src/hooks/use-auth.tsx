import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
  logout: () => void; // Méthode simplifiée pour faciliter la déconnexion
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      // Vider tous les caches précédents pour assurer une isolation complète entre utilisateurs
      queryClient.removeQueries({ queryKey: ["/api/families"] });
      queryClient.removeQueries({ predicate: (query) => {
        const queryKey = Array.isArray(query.queryKey) ? query.queryKey[0] : query.queryKey;
        return typeof queryKey === 'string' && queryKey.startsWith("/api/families/");
      }});
      
      // Définir l'utilisateur actuel
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "התחברת בהצלחה",
        description: `ברוך הבא, ${user.firstName} ${user.lastName}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "התחברות נכשלה",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      console.log("Tentative d'inscription via registerMutation avec:", credentials);
      
      try {
        // Vérification de la structure des données avant envoi
        if (!credentials.username || !credentials.password || !credentials.email || 
            !credentials.firstName || !credentials.lastName) {
          console.error("Données d'inscription incomplètes:", credentials);
          throw new Error("Données d'inscription incomplètes");
        }
        
        console.log("Envoi de la requête avec les données:", JSON.stringify(credentials));
        
        // Utilisation directe de fetch pour mieux contrôler la requête
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
          credentials: 'include'
        });
        
        console.log("Statut de la réponse API:", response.status);
        console.log("Headers de la réponse:", Object.fromEntries([...response.headers.entries()]));
        
        // Obtenir le contenu de la réponse
        const responseText = await response.text();
        console.log("Contenu brut de la réponse:", responseText);
        
        // Vérifier si la réponse est OK
        if (!response.ok) {
          console.error(`Erreur ${response.status} lors de l'inscription:`, responseText);
          throw new Error(responseText || `Erreur ${response.status}`);
        }
        
        // Tenter de parser la réponse JSON
        let userData;
        try {
          userData = JSON.parse(responseText);
          console.log("Données utilisateur parsées:", userData);
        } catch (parseError) {
          console.error("Erreur de parsing JSON:", parseError);
          throw new Error("Réponse invalide du serveur");
        }
        
        return userData;
      } catch (error) {
        console.error("Exception pendant l'inscription:", error);
        throw error;
      }
    },
    onSuccess: (user: SelectUser) => {
      console.log("Inscription réussie:", user);
      
      // Vider tous les caches précédents pour assurer une isolation complète entre utilisateurs
      queryClient.removeQueries({ queryKey: ["/api/families"] });
      queryClient.removeQueries({ predicate: (query) => {
        const queryKey = Array.isArray(query.queryKey) ? query.queryKey[0] : query.queryKey;
        return typeof queryKey === 'string' && queryKey.startsWith("/api/families/");
      }});
      
      // Définir l'utilisateur actuel
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "נרשמת בהצלחה",
        description: `ברוך הבא, ${user.firstName} ${user.lastName}`,
      });
    },
    onError: (error: Error) => {
      console.error("Erreur d'inscription (mutation):", error);
      toast({
        title: "הרשמה נכשלה",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      // Vider le cache utilisateur
      queryClient.setQueryData(["/api/user"], null);
      
      // Vider le cache des familles et des données associées
      queryClient.removeQueries({ queryKey: ["/api/families"] });
      // Vider tous les caches qui commencent par "/api/families/"
      queryClient.removeQueries({ predicate: (query) => {
        const queryKey = Array.isArray(query.queryKey) ? query.queryKey[0] : query.queryKey;
        return typeof queryKey === 'string' && queryKey.startsWith("/api/families/");
      }});
      
      toast({
        title: "התנתקת בהצלחה",
        description: "להתראות!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "ההתנתקות נכשלה",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Méthode de déconnexion simplifiée
  const logout = () => {
    logoutMutation.mutate();
  };

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
