import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/firebase'; // Import auth from your firebase config file

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

  const cleanCpf = (cpf: string): string => {
    return cpf.replace(/[\.\-]/g, '');
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            // Só atualiza se o UID corresponder ao usuário do Firebase
            if (userData.uid === firebaseUser.uid) {
              setUser(userData);
            } else {
              // Se o UID não corresponder, limpa e faz logout
              localStorage.removeItem('currentUser');
              setUser(null);
            }
          } catch (error) {
            console.error('❌ [useAuth] Erro ao carregar usuário salvo:', error);
            logout();
          }
        } else {
          // Se não há usuário salvo mas há Firebase user, limpa
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (cpf: string, password: string, userType: 'aluno' | 'professor') => {
    const cleanedCpf = cleanCpf(cpf);
    if (!cleanedCpf || !/^\d{11}$/.test(cleanedCpf)) {
      toast({
        title: 'Erro no login',
        description: 'O CPF deve conter 11 dígitos numéricos.',
        variant: 'destructive',
      });
      return { success: false, error: 'Invalid CPF format' };
    }

    try {
      const response = await apiFetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf, password, userType }),
      });

      if (!response.ok) {
        // Lê o body da resposta apenas uma vez
        let errorMessage = 'Tipo ou CPF ou Senha incorretos';
        try {
          const errorData = await response.json();
          // Se a API retornar uma mensagem específica, usa ela
          // Mas para 401, sempre mostra a mensagem amigável
          if (response.status === 401) {
            errorMessage = 'Tipo ou CPF ou Senha incorretos';
          } else {
            errorMessage = errorData.error || errorMessage;
          }
        } catch (parseError) {
          // Se não conseguir ler o JSON, usa a mensagem padrão
          if (response.status === 401) {
            errorMessage = 'Tipo ou CPF ou Senha incorretos';
          } else {
            errorMessage = 'Erro ao fazer login. Tente novamente.';
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const { token, ...userDataResponse } = data;

      const userCredential = await signInWithCustomToken(auth, token);
      const firebaseUser = userCredential.user;

      if (firebaseUser) {
        const userData = {
          uid: firebaseUser.uid,
          email: userDataResponse.email,
          nomeCompleto: userDataResponse.nomeCompleto,
          userType: userDataResponse.userType,
          cpf: cleanedCpf,
        };

        // Salva no localStorage primeiro
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        // Aguarda o Firebase processar completamente o estado de autenticação
        // e garantir que o onAuthStateChanged seja disparado antes de atualizar o estado
        await new Promise<void>((resolve) => {
          let resolved = false;
          
          // Escuta o onAuthStateChanged para confirmar que o Firebase processou
          const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user && user.uid === firebaseUser.uid && !resolved) {
              resolved = true;
              unsubscribe();
              // Aguarda um pouco mais para garantir que tudo está sincronizado
              setTimeout(() => {
                resolve();
              }, 300);
            }
          });
          
          // Timeout de segurança caso o onAuthStateChanged não dispare em 1 segundo
          setTimeout(() => {
            if (!resolved) {
              resolved = true;
              unsubscribe();
              resolve();
            }
          }, 1500);
        });

        // Atualiza o estado do usuário após confirmar que o Firebase está pronto
        setUser(userData);

        toast({
          title: 'Login realizado com sucesso!',
          description: `Bem-vindo, ${userData.nomeCompleto}`,
        });

        // Navega após confirmar que o Firebase está pronto e o estado foi atualizado
        // Usa replace: true para evitar problemas de histórico
        const targetPath = userType === 'aluno' ? '/student' : '/professor';
        navigate(targetPath, { replace: true });
        
        return { success: true };
      }
      throw new Error('Falha ao autenticar com Firebase.');

    } catch (error: any) {
      console.error('❌ [useAuth] Erro no login:', error.message);
      toast({
        title: 'Erro no login',
        description: error.message || 'Erro ao tentar fazer login',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
  };

  const register = async (userData: any) => {
    const cleanedCpf = cleanCpf(userData.cpf || '');
    
    if (!cleanedCpf || !/^\d{11}$/.test(cleanedCpf)) {
      toast({
        title: 'Erro no cadastro',
        description: 'O CPF deve conter 11 dígitos numéricos.',
        variant: 'destructive',
      });
      return { success: false, error: 'Invalid CPF format' };
    }

    if (!userData.password || userData.password.length < 6) {
      toast({
        title: 'Erro no cadastro',
        description: 'A senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
      });
      return { success: false, error: 'Password too short' };
    }

    if (userData.password === cleanedCpf) {
      toast({
        title: 'Erro no cadastro',
        description: 'A senha não pode ser igual ao CPF.',
        variant: 'destructive',
      });
      return { success: false, error: 'Password cannot be equal to CPF' };
    }

    try {
      const response = await apiFetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomeCompleto: userData.nomeCompleto,
          cpf: cleanedCpf,
          userType: userData.userType,
          dataNascimento: userData.dataNascimento,
          password: userData.password,
          genero: userData.genero,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Erro ao realizar cadastro';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          errorMessage = 'Erro ao realizar cadastro. Tente novamente.';
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      toast({
        title: 'Cadastro realizado com sucesso!',
        description: 'Você pode fazer login agora.',
      });

      return { success: true, data };
    } catch (error: any) {
      console.error('❌ [useAuth] Erro no cadastro:', error.message);
      toast({
        title: 'Erro no cadastro',
        description: error.message || 'Erro ao tentar fazer cadastro',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    auth.signOut();
    localStorage.removeItem('currentUser');
    setUser(null);
    toast({
      title: 'Logout realizado',
      description: 'Até logo!',
    });
    navigate('/');
  };

  const getAuthToken = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      return await currentUser.getIdToken();
    }
    return null;
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