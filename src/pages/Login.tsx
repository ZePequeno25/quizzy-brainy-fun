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
 * - Sucesso no login → redireciona para / (Index cuida do resto)
 * - Link para cadastro → /register
 * - Link para recuperação → /forgot-password
 * 
 * ENDPOINT BACKEND:
 * POST https://aprender-em-movimento.onrender.com/login
 * Body: { cpf: string, password: string, userType: 'aluno' | 'professor' }
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";

const Login = () => {
  console.log('📍 [LOGIN] Página de login carregada');
  
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<'aluno' | 'professor' | ''>("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
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

  /**
   * HANDLER: Formatação de CPF durante digitação
   * Aplica máscara automática: 000.000.000-00
   */
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    console.log('⌨️ [LOGIN] CPF digitado:', { original: e.target.value, formatado: formatted });
    setCpf(formatted);
  };

  /**
   * HANDLER: Submissão do formulário de login
   * 
   * FLUXO:
   * 1. Valida se tipo de usuário foi selecionado
   * 2. Remove formatação do CPF (mantém apenas números)
   * 3. Chama função login do hook useAuth
   * 4. Se sucesso: redireciona para / (Index faz roteamento final)
   * 5. Se erro: useAuth já mostra toast de erro
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 [LOGIN] Formulário submetido', {
      cpf: cpf.replace(/\D/g, ''),
      userType,
      temSenha: !!password
    });
    
    if (!userType) {
      console.warn('⚠️ [LOGIN] Tipo de usuário não selecionado');
      return;
    }

    setLoading(true);
    console.log('🔐 [LOGIN] Iniciando processo de autenticação...');
    
    const result = await login(cpf.replace(/\D/g, ''), password, userType);
    
    if (result.success) {
      console.log('✅ [LOGIN] Login bem-sucedido! Redirecionando para página inicial...');
      navigate('/');
    } else {
      console.error('❌ [LOGIN] Falha no login:', result.error);
    }
    
    setLoading(false);
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
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={loading}
                >
                  {loading ? "Entrando..." : "Entrar"}
                </Button>

                <div className="text-center space-y-2">
                  <Button 
                    variant="link" 
                    onClick={() => {
                      console.log('🔗 [LOGIN] Navegando para página de cadastro');
                      navigate('/register');
                    }}
                    className="text-purple-600"
                  >
                    Não tem conta? Cadastre-se
                  </Button>
                  <Button 
                    variant="link" 
                    onClick={() => {
                      console.log('🔗 [LOGIN] Navegando para recuperação de senha');
                      navigate('/forgot-password');
                    }}
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