import { auth } from '@/firebase'; // Import auth from your firebase config file

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
 * Faz uma requisição para a API com verificação de disponibilidade e autenticação
 */
export const apiFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const user = auth.currentUser;

  let headers = new Headers(options.headers);

  if (user) {
    try {
      const token = await user.getIdToken();
      headers.set('Authorization', `Bearer ${token}`);
    } catch (error) {
      console.error('❌ [apiFetch] Erro ao obter token de autenticação:', error);
    }
  }

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    if (!response.ok && response.status >= 500) {
      console.error(`Erro na API: ${response.status} - ${endpoint}`);
    }
    return response;
  } catch (error) {
    console.error(`Falha ao conectar com a API: ${endpoint}`, error);
    throw error;
  }
};
