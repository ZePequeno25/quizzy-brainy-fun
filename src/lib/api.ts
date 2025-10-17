const API_URL = 'https://aprender-em-movimento-js.onrender.com/api';

/**
 * Verifica se a API está disponível
 */
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    console.error('API não está disponível:', error);
    return false;
  }
};

/**
 * Faz uma requisição para a API com verificação de disponibilidade
 */
export const apiFetch = async (endpoint: string, options?: RequestInit): Promise<Response> => {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, options);
    if (!response.ok && response.status >= 500) {
      console.error(`Erro na API: ${response.status} - ${endpoint}`);
    }
    return response;
  } catch (error) {
    console.error(`Falha ao conectar com a API: ${endpoint}`, error);
    throw error;
  }
};
