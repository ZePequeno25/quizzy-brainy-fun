import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { getAuth, signInWithCustomToken } from 'firebase/auth';

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
  const auth = getAuth();

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
            setUser(userData);
          } catch (error) {
            console.error('❌ [useAuth] Erro ao carregar usuário salvo:', error);
            logout();
          }
        } else {
          // This case might happen if the local storage is cleared but the Firebase session persists.
          // You might want to fetch user data from your backend here.
          logout();
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro no login');
      }

      const data = await response.json();
      const { token, ...userDataResponse } = data;

      // Step 1: Sign in with the custom token
      const userCredential = await signInWithCustomToken(auth, token);
      const firebaseUser = userCredential.user;

      if (firebaseUser) {
        // Step 2: Prepare user data for local storage
        const userData = {
          uid: firebaseUser.uid,
          email: userDataResponse.email,
          nomeCompleto: userDataResponse.nomeCompleto,
          userType: userDataResponse.userType,
          cpf: cleanedCpf,
        };

        // Step 3: Persist user data
        localStorage.setItem('currentUser', JSON.stringify(userData));
        setUser(userData);

        toast({
          title: 'Login realizado com sucesso!',
          description: `Bem-vindo, ${userData.nomeCompleto}`,
        });

        navigate(userType === 'aluno' ? '/student' : '/professor');
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
    // ... (rest of the register function remains the same)
  };

  const logout = () => {
    auth.signOut();
    localStorage.removeItem('currentUser');
    // You might want to clear other specific local storage items here as well
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