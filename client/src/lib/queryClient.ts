import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getCookie } from "@/lib/utils";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: RequestInit,
): Promise<Response> {
  // Récupérer le token CSRF du cookie
  const csrfToken = getCookie('XSRF-TOKEN');
  
  console.log(`API Request ${method} ${url}:`);
  console.log(`- CSRF Token: ${csrfToken || 'Non trouvé'}`);
  console.log(`- Cookies disponibles: ${document.cookie}`);
  
  // Préparer les headers avec CSRF token
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {})
  };
  
  if (csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
    console.log('- Header CSRF ajouté');
  } else {
    console.warn('- Attention: Aucun CSRF token dans les cookies');
    
    // Cas spécifique d'inscription - désactiver temporairement le besoin de CSRF
    if (url === '/api/register') {
      console.log('- Route d\'inscription: ajout d\'un header spécial pour éviter CSRF');
      headers["X-No-CSRF"] = "registration-special-case";
    }
  }
  
  // Combine options while ensuring headers with CSRF token are always included
  const fetchOptions: RequestInit = {
    ...options,
    method,
    headers,
    credentials: "include",
  };
  
  // N'ajoutez pas de body pour les requêtes GET ou HEAD
  if (method !== 'GET' && method !== 'HEAD' && data !== undefined) {
    fetchOptions.body = JSON.stringify(data);
  }

  const res = await fetch(url, fetchOptions);

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Récupérer le token CSRF du cookie
    const csrfToken = getCookie('XSRF-TOKEN');
    
    // Préparer les headers avec CSRF token
    const headers: Record<string, string> = {};
    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken;
    }
    
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
      throwOnError: false
    },
    mutations: {
      retry: false,
      throwOnError: false
    },
  },
});
