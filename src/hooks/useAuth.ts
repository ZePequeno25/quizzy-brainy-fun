/**
 * ==================== HOOK DE AUTENTICAÇÃO (useAuth) ====================
 * 
 * DESCRIÇÃO:
 * Hook customizado para gerenciar autenticação de usuários
 * Centraliza toda lógica de login, registro, logout e persistência
 * 
 * ESTADOS GERENCIADOS:
 * - user: Dados do usuário logado (null se não autenticado)
 * - loading: Estado de carregamento da verificação de autenticação
 * 
 * FUNÇÕES EXPOSTAS:
 * - login(cpf, password, userType): Autentica usuário
 * - register(userData): Registra novo usuário
 * - logout(): Desautentica e limpa todos os dados
 * - getAuthToken(): Retorna token JWT armazenado
 * 
 * PERSISTÊNCIA:
 * - Dados do usuário salvos em localStorage ('currentUser')
 * - Token JWT salvo em localStorage ('authToken')
 * - Limpeza completa de dados ao fazer logout
 * 
 * BACKEND ENDPOINTS:
 * - POST /login: Autentica usuário
 * - POST /register: Registra novo usuário
 */

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "@/lib/api";

interface User {
  uid: string;
  email: string;
  nomeCompleto: string;
  userType: 'aluno' | 'professor';
  cpf: string;
  score?: number;
  rank?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  /**
   * FUNÇÃO: Limpar formatação do CPF
   * Remove pontos e hífen do CPF, retornando apenas dígitos
   * @param cpf - CPF com ou sem formatação
   * @returns CPF com apenas dígitos
   */
  const cleanCpf = (cpf: string): string => {
    return cpf.replace(/[\.\-]/g, '');
  };

  /**
   * EFEITO: Inicialização - Verificar sessão existente
   */
  useEffect(() => {
    console.log('🔐 [useAuth] Inicializando hook de autenticação...');
    
    // Verificar se há usuário salvo no localStorage
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        console.log('✅ [useAuth] Sessão existente encontrada:', {
          uid: userData.uid,
          nome: userData.nomeCompleto,
          tipo: userData.userType
        });
        setUser(userData);
      } catch (error) {
        console.error('❌ [useAuth] Erro ao carregar usuário salvo:', error);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userEmail');
      }
    } else {
      console.log('ℹ️ [useAuth] Nenhuma sessão existente encontrada');
    }
    setLoading(false);
  }, []);

 /**
   * FUNÇÃO: Login de usuário
   * 
   * PARÂMETROS:
   * @param cpf - CPF sem formatação (apenas números, 11 dígitos)
   * @param password - Senha do usuário
   * @param userType - Tipo de usuário ('aluno' | 'professor')
   * 
   * FLUXO:
   * 1. Valida CPF (11 dígitos)
   * 2. Envia requisição POST para /api/login com { cpf, password, userType }
   * 3. Se sucesso:
   *    - Salva dados do usuário e email no localStorage
   *    - Salva token JWT no localStorage
   *    - Atualiza estado local com dados do usuário
   *    - Redireciona para /student ou /professor
   *    - Exibe toast de sucesso
   * 4. Se erro:
   *    - Exibe toast com mensagem de erro
   *    - Retorna objeto com success: false
   * 
   * RETORNO:
   * { success: boolean, error?: string }
   */

  const login = async (cpf: string, password: string, userType: 'aluno' | 'professor') => {
    console.log('🔐 [useAuth] Tentando fazer login...', { cpf, userType });

    const cleanedCpf = cleanCpf(cpf);
    if (!cleanedCpf || !/^\d{11}$/.test(cleanedCpf)) {
      console.error('❌ [useAuth] CPF inválido:', cpf);
      toast({
        title: "Erro no login",
        description: "O CPF deve conter 11 dígitos numéricos (ex.: 12345678901).",
        variant: "destructive",
      });
      return { success: false, error: 'Invalid CPF format' };
    }

    if(!password || !userType) {
      console.error('❌ [useAuth] Campos obrigatórios faltando:', { password: !!password, userType: !!userType });
      toast({
        title: "Erro no login",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return { success: false, error: 'Missing password or userType' };
    }
    
    try {
      const response = await apiFetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf, password, userType })
      });

      console.log('📡 [useAuth] Resposta do servidor:', response.status);
      
      // Verificar se a resposta é JSON
      const contentType = response.headers.get('content-type');
      console.log('📋 [useAuth] Content-Type da resposta:', contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ [useAuth] API retornou HTML ao invés de JSON:', text.substring(0, 200));
        throw new Error('Erro de comunicação com o servidor. A API não está respondendo corretamente.');
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [useAuth] Erro na resposta:', errorData);
        throw new Error(errorData.error || 'Erro no login');
      }

      const data = await response.json();
      const userData = {
        uid: data.userId,
        email: data.email || localStorage.getItem('userEmail'),
        nomeCompleto: data.nomeCompleto,
        userType: data.userType,
        cpf
      };
      
      console.log('✅ [useAuth] Login bem-sucedido!', {
        uid: userData.uid,
        nome: userData.nomeCompleto,
        tipo: userData.userType
      });
      
      // Salvar no localStorage
      localStorage.setItem('currentUser', JSON.stringify(userData));
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userEmail', userData.email);
      console.log('💾 [useAuth] Dados salvos no localStorage');
      
      setUser(userData);
      
      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo, ${userData.nomeCompleto}`,
      });

      navigate(userType === 'aluno' ? '/student' : '/professor');
      return { success: true };
    } catch (error: any) {
      console.error('❌ [useAuth] Erro no login:', error.message);
      toast({
        title: "Erro no login",
        description: error.message || "Erro ao tentar fazer login",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  /**
   * FUNÇÃO: Registro de novo usuário
   * 
   * PARÂMETROS:
   * @param userData - Objeto com dados do novo usuário
   *   { userType, nomeCompleto, cpf, password, genero, dataNascimento }
   * 
   * FLUXO:
   * 1. Envia requisição POST para backend /register
   * 2. Se sucesso:
   *    - Exibe toast de sucesso
   *    - Usuário deve fazer login após cadastro
   * 3. Se erro:
   *    - Exibe toast com mensagem de erro
   * 
   * RETORNO:
   * { success: boolean, error?: string }
   */
  const register = async (userData: {
    userType: 'aluno' | 'professor';
    nomeCompleto: string;
    cpf: string;
    genero: string;
    dataNascimento: string;
  }) => {
    console.log('📝 [useAuth] Tentando registrar novo usuário...', {
      tipo: userData.userType,
      nome: userData.nomeCompleto
    });
    
    const cleanedCpf = cleanCpf(userData.cpf);
    if (!cleanedCpf || !/^\d{11}$/.test(cleanedCpf)) {
      console.error('❌ [useAuth] CPF inválido:', userData.cpf);
      toast({
        title: "Erro no cadastro",
        description: "O CPF deve conter 11 dígitos numéricos (ex.: 12345678901).",
        variant: "destructive",
      });
      return { success: false, error: 'Invalid CPF format' };
    }
    
    try {
      const response = await apiFetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      // Verificar se a resposta é JSON
      const contentType = response.headers.get('content-type');
      console.log('📋 [useAuth] Content-Type da resposta:', contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ [useAuth] API retornou HTML ao invés de JSON:', text.substring(0, 200));
        throw new Error('Erro de comunicação com o servidor. A API não está respondindo corretamente.');
      }

      const data = await response.json();
      console.log('📡 [useAuth] Resposta do servidor:', response.status);
      
      if (!response.ok) {
        console.error('❌ [useAuth] Erro no cadastro:', data.error);
        throw new Error(data.error || 'Erro no cadastro');
      }

      localStorage.setItem('userEmail', data.email);
      console.log('💾 [useAuth] Email salvo no localStorage:', data.email);
      
      console.log('✅ [useAuth] Cadastro realizado com sucesso!');
      toast({
        title: "Cadastro realizado com sucesso!",
        description: `Email gerado: ${data.email}. Agora você pode fazer login.`,
      });

      return { success: true };
    } catch (error: any) {
      console.error('❌ [useAuth] Erro no cadastro:', error.message);
      toast({
        title: "Erro no cadastro",
        description: error.message || "Erro ao tentar fazer cadastro",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  /**
   * FUNÇÃO: Logout de usuário
   * 
   * AÇÕES REALIZADAS:
   * 1. Remove dados do usuário do localStorage
   * 2. Remove token JWT do localStorage
   * 3. Limpa TODOS os estados persistidos relacionados ao usuário:
   *    - Questões (questions_*)
   *    - Quiz (quizQuestions_*, quizState_*)
   *    - Chat (isChatOpen_*, chattingWith_*, chatMessages_*)
   *    - Professor (students_*, editingQuestion_*)
   *    - Vínculo (relations_*, teacherCode_*)
   *    - Comentários (comments_*, newComment_*, responseText_*, respondingTo_*)
   * 4. Atualiza estado local (user = null)
   * 5. Exibe toast de despedida
   * 6. Redireciona para página inicial (/)
   */
  const logout = () => {
    console.log('🚪 [useAuth] Realizando logout...');
    
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    console.log('🗑️ [useAuth] Dados de autenticação removidos');
    
    let removedKeys = 0;
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('questions_') || key.startsWith('quizQuestions_') || key.startsWith('isChatOpen_') || key.startsWith('chattingWith_') || key.startsWith('students_') || key.startsWith('relations_') || key.startsWith('teacherCode_') || key.startsWith('comments_') || key.startsWith('editingQuestion_') || key.startsWith('chatMessages_') || key.startsWith('newComment_') || key.startsWith('responseText_') || key.startsWith('respondingTo_') || key.startsWith('quizState_')) {
        localStorage.removeItem(key);
        removedKeys++;
      }
    });
    console.log(`✅ [useAuth] ${removedKeys} chaves removidas do localStorage`);
    
    setUser(null);
    
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
    
    console.log('🔀 [useAuth] Redirecionando para página inicial...');
    navigate('/');
  };

  /**
   * FUNÇÃO: Obter token JWT de autenticação
   * 
   * RETORNO:
   * string | null - Token JWT ou null se não autenticado
   * 
   * USO:
   * Usado para autenticar requisições ao backend
   * Header: Authorization: Bearer {token}
   */
  const getAuthToken = () => {
    const token = localStorage.getItem('authToken');
    console.log('🔑 [useAuth] Token solicitado:', token ? 'Token encontrado' : 'Nenhum token');
    return token;
  };

  return {
    user,
    loading,
    login,
    register,
    logout,
    getAuthToken
  };
};