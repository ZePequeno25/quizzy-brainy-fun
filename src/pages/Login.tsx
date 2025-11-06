/**
 * ==================== PÁGINA DE LOGIN ====================
 * 
 * DESCRIÇÃO:
 * Formulário de autenticação de usuários (alunos e professores)
 * 
 * FUNCIONALIDADES:
 * - Seleção de tipo de usuário (aluno/professor)
 * - Input de CPF com formatação automática (000.000.000-00)
 * - Input de senha
 * - Validação de campos obrigatórios
 * - Integração com backend de autenticação
 * 
 * NAVEGAÇÃO:
 * - Sucesso no login → redireciona diretamente para /student ou /professor
 * - Link para cadastro → /register
 * - Link para recuperação → /forgot-password
 * 
 * ENDPOINT BACKEND:
 * POST https://aprender-em-movimento.onrender.com/api/login
 * Body: { cpf: string, password: string, userType: 'aluno' | 'professor' }
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";

const Login = () => {
  console.log('📍 [LOGIN] Página de login carregada');
  
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<'aluno' | 'professor' | ''>("");
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const formatCPF = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length <= 11) {
      return cleanValue
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2');
    }
    return value;
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setCpf(formatted);
  };

  const handleGoogleLogin = async () => {
    if (!userType) {
      toast({
        title: 'Erro no login',
        description: 'Por favor, selecione o tipo de usuário antes de fazer login com Google',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    console.log('🔐 [LOGIN] Iniciando login com Google...');
    
    const result = await loginWithGoogle(userType as 'aluno' | 'professor');
    
    if (!result.success) {
      setLoading(false);
    }
  };

  /**
   * HANDLER: Submissão do formulário de login
   * 
   * FLUXO:
   * 1. Valida se tipo de usuário foi selecionado
   * 2. Remove formatação do CPF (mantém apenas números)
   * 3. Chama função login do hook useAuth
   * 4. Se sucesso: redireciona para a página específica (/student ou /professor)
   * 5. Se erro: useAuth já mostra toast de erro
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userType) {
      console.warn('⚠️ [LOGIN] Tipo de usuário não selecionado');
      toast({
        title: 'Erro no login',
        description: 'Por favor, selecione o tipo de usuário',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    console.log('🔐 [LOGIN] Iniciando processo de autenticação...');
    
    const result = await login(cpf.replace(/\D/g, ''), password, userType);
    
    if (result.success) {
      console.log(`✅ [LOGIN] Login bem-sucedido como ${userType}! Redirecionando...`);
      // O navigate já é feito dentro do hook useAuth após o Firebase confirmar
    } else {
      console.error('❌ [LOGIN] Falha no login:', result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center text-purple-600">
                Login
              </CardTitle>
              <CardDescription className="text-center">
                Entre com suas credenciais para acessar o sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="userType">Tipo de Usuário</Label>
                  <Select value={userType} onValueChange={(value: 'aluno' | 'professor') => setUserType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aluno">Aluno</SelectItem>
                      <SelectItem value="professor">Professor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={handleCpfChange}
                    maxLength={14}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={loading || !userType}
                >
                  {loading ? "Entrando..." : "Entrar"}
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Ou continue com</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleLogin}
                  disabled={loading || !userType}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Entrar com Google
                </Button>

                <div className="text-center space-y-2">
                  <Button 
                    variant="link" 
                    onClick={() => navigate('/register')}
                    className="text-purple-600"
                  >
                    Não tem conta? Cadastre-se
                  </Button>
                  <Button 
                    variant="link" 
                    onClick={() => navigate('/forgot-password')}
                    className="text-purple-600"
                  >
                    Esqueci minha senha
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;