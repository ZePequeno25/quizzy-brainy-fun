
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
  const headers = new Headers(options.headers);

  // Garante que o Content-Type seja definido, se não estiver presente
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Se houver um usuário logado, obtém o token e o adiciona ao cabeçalho.
  if (user) {
    try {
      // Força a renovação do token para garantir que está sempre atualizado.
      const token = await user.getIdToken(true);
      headers.set('Authorization', `Bearer ${token}`);
    } catch (error) {
      console.error('❌ [apiFetch] Erro ao obter ou renovar token de autenticação:', error);
      // Lança um erro para interromper a requisição, pois ela estaria não autenticada.
      throw new Error('Falha na autenticação do usuário.');
    }
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);

    // Adiciona log detalhado para todas as respostas não-OK
    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Corpo da resposta não pôde ser lido');
      console.error(
        `❌ [apiFetch] API call para ${endpoint} falhou com status ${response.status}. Corpo: ${errorBody}`
      );
    }

    return response;
  } catch (error) {
    // Log para erros de rede (ex: falha na conexão)
    console.error(`❌ [apiFetch] Falha de rede ao conectar com a API: ${endpoint}`, error);
    // Relança o erro para que a lógica de chamada (e.g., em um hook) possa tratá-lo.
    throw error;
  }
};
