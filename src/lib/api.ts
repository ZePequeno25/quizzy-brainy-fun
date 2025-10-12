const PRIMARY_API = 'https://aprender-em-movimento-js.onrender.com';
const FALLBACK_API = 'https://aprender-em-movimento.onrender.com';

let currentApi = PRIMARY_API;

/**
 * Faz uma requisição com fallback automático para API secundária
 */
export const apiFetch = async (endpoint: string, options?: RequestInit): Promise<Response> => {
  try {
    const response = await fetch(`${currentApi}${endpoint}`, options);
    
    // Se a resposta for ok, retorna
    if (response.ok || response.status < 500) {
      return response;
    }
    
    // Se der erro de servidor, tenta o fallback
    throw new Error('Server error');
  } catch (error) {
    // Se falhar e ainda estiver usando a API primária, tenta a secundária
    if (currentApi === PRIMARY_API) {
      console.warn('API primária falhou, tentando API de fallback...');
      currentApi = FALLBACK_API;
      
      try {
        const response = await fetch(`${currentApi}${endpoint}`, options);
        return response;
      } catch (fallbackError) {
        // Se o fallback também falhar, volta para a primária na próxima tentativa
        currentApi = PRIMARY_API;
        throw fallbackError;
      }
    }
    
    throw error;
  }
};

/**
 * Reseta a API para a primária (útil para testes)
 */
export const resetApiToPrimary = () => {
  currentApi = PRIMARY_API;
};

/**
 * Retorna a URL da API atualmente em uso
 */
export const getCurrentApi = () => currentApi;
