const API_URL = 'https://aprender-em-movimento-js.onrender.com';

/**
 * Faz uma requisição para a API
 */
export const apiFetch = async (endpoint: string, options?: RequestInit): Promise<Response> => {
  return fetch(`${API_URL}${endpoint}`, options);
};
