/**
 * ==================== PÁGINA DE CADASTRO ====================
 * 
 * DESCRIÇÃO:
 * Formulário completo de registro de novos usuários
 * 
 * CAMPOS DO FORMULÁRIO:
 * - userType: Tipo de usuário (aluno/professor)
 * - nomeCompleto: Nome completo do usuário
 * - cpf: CPF com formatação automática
 * - password: Senha
 * - genero: Gênero (masculino/feminino/outro/prefiro-nao-dizer)
 * - dataNascimento: Data de nascimento (campo date)
 * 
 * FUNCIONALIDADES:
 * - Validação de todos os campos obrigatórios
 * - Formatação automática de CPF
 * - Limpeza de formatação antes de envio ao backend
 * - Feedback visual de loading durante cadastro
 * 
 * NAVEGAÇÃO:
 * - Sucesso no cadastro → redireciona para /login
 * - Link para login → /login (se já tem conta)
 * 
 * ENDPOINT BACKEND:
 * POST https://aprender-em-movimento.onrender.com/register
 * Body: { userType, nomeCompleto, cpf, password, genero, dataNascimento }
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

const Register = () => {
  console.log('📍 [REGISTER] Página de cadastro carregada');
  
  const [formData, setFormData] = useState({
    userType: "",
    nomeCompleto: "",
    cpf: "",
    password: "",
    genero: "",
    dataNascimento: ""
  });
  const [loading, setLoading] = useState(false);
  const { register, registerWithGoogle } = useAuth();
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


  /**
   * HANDLER: Atualização de campos do formulário
   * Aplica formatação especial para CPF
   */
  const handleInputChange = (field: string, value: string) => {
    if (field === 'cpf') {
      value = formatCPF(value);
      console.log('⌨️ [REGISTER] CPF formatado:', value);
    }
    console.log('📝 [REGISTER] Campo atualizado:', field, '=', field === 'password' ? '***' : value);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGoogleRegister = async () => {
    if (!formData.userType) {
      toast({
        title: 'Erro no cadastro',
        description: 'Por favor, selecione o tipo de usuário antes de cadastrar com Google',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    console.log('🔐 [REGISTER] Iniciando cadastro com Google...');
    
    const result = await registerWithGoogle(formData.userType as 'aluno' | 'professor');
    
    if (!result.success) {
      setLoading(false);
    }
  };

  /**
   * HANDLER: Submissão do formulário de cadastro
   * 
   * FLUXO:
   * 1. Remove formatação do CPF (mantém apenas números)
   * 2. Envia dados para backend via hook useAuth
   * 3. Se sucesso: redireciona para login
   * 4. Se erro: useAuth exibe toast de erro
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 [REGISTER] Formulário de cadastro submetido', {
      ...formData,
      password: '***', // Não logar senha
      cpf: formData.cpf.replace(/\D/g, '')
    });
    
    setLoading(true);
    
    // Limpar CPF para envio (remover pontos e traços)
    const dataToSend = {
      userType: formData.userType as 'aluno' | 'professor',
      nomeCompleto: formData.nomeCompleto,
      cpf: formData.cpf.replace(/\D/g, ''),
      genero: formData.genero,
      dataNascimento: formData.dataNascimento
    };
    
    console.log('📤 [REGISTER] Enviando dados para backend...');
    const result = await register(dataToSend);
    
    if (result.success) {
      console.log('✅ [REGISTER] Cadastro bem-sucedido! Redirecionando para login...');
      navigate('/login');
    } else {
      console.error('❌ [REGISTER] Falha no cadastro:', result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center text-purple-600">
                Cadastro
              </CardTitle>
              <CardDescription className="text-center">
                Preencha os dados para criar sua conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="userType">Tipo de Usuário</Label>
                    <Select 
                      value={formData.userType} 
                      onValueChange={(value) => handleInputChange('userType', value)}
                    >
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
                    <Label htmlFor="nomeCompleto">Nome Completo</Label>
                    <Input
                      id="nomeCompleto"
                      type="text"
                      value={formData.nomeCompleto}
                      onChange={(e) => handleInputChange('nomeCompleto', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      type="text"
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={(e) => handleInputChange('cpf', e.target.value)}
                      maxLength={14}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="genero">Gênero</Label>
                    <Select 
                      value={formData.genero} 
                      onValueChange={(value) => handleInputChange('genero', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="feminino">Feminino</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                        <SelectItem value="prefiro-nao-dizer">Prefiro não dizer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                    <Input
                      id="dataNascimento"
                      type="date"
                      value={formData.dataNascimento}
                      onChange={(e) => handleInputChange('dataNascimento', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={loading}
                >
                  {loading ? "Cadastrando..." : "Criar Conta"}
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Ou cadastre-se com</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleRegister}
                  disabled={loading || !formData.userType}
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
                  Cadastrar com Google
                </Button>

                <div className="text-center">
                  <Button 
                    variant="link" 
                    onClick={() => navigate('/login')}
                    className="text-purple-600"
                  >
                    Já tem conta? Faça login
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

export default Register;