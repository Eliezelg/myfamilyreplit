/**
 * Fonction utilitaire pour effectuer des requêtes API
 * @param method Méthode HTTP (GET, POST, PUT, DELETE)
 * @param endpoint Point de terminaison de l'API
 * @param data Données à envoyer (pour POST et PUT)
 * @returns Réponse de la requête
 */
export async function apiRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: any
): Promise<Response> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Ajouter le token CSRF si disponible
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  const options: RequestInit = {
    method,
    headers,
    credentials: 'include', // Inclure les cookies pour l'authentification
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(endpoint, options);
    return response;
  } catch (error) {
    console.error(`Erreur lors de la requête API ${method} ${endpoint}:`, error);
    throw error;
  }
}
