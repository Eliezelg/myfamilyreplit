import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getCookie } from "@/lib/utils";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  data?: unknown | undefined,
  options?: RequestInit,
): Promise<Response> {
  // Récupérer le token CSRF du cookie
  const csrfToken = getCookie('XSRF-TOKEN');
  
  // Préparer les headers avec CSRF token
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string> || {})
  };
  
  if (csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }
  
  const method = options?.method || 'GET';
  
  // Combine options while ensuring headers with CSRF token are always included
  const fetchOptions = {
    ...options,
    method,
    headers,
    body: data as BodyInit | null | undefined,
    credentials: "include",
  };

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
