import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

const ForgotPassword = () => {
  const [cpf, setCpf] = useState("");
  const [userType, setUserType] = useState<'aluno' | 'professor' | ''>("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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
    setCpf(formatCPF(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!userType) {
      toast({
        title: "Erro",
        description: "Selecione o tipo de usuário",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
  
    try {
      const cleanedCpf = cpf.replace(/\D/g, '');
    
      console.log('🔍 [ForgotPassword] Enviando para verificação:', {
        cpf: cleanedCpf,
        userType
      });

      // ✅ TESTE: Verifique a URL completa
      const apiUrl = '/verify_user_for_password_reset';
      console.log('🌐 [ForgotPassword] Chamando API:', apiUrl);

      const response = await apiFetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cpf: cleanedCpf, 
          userType 
        })
      });

      console.log('📨 [ForgotPassword] Resposta recebida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      const data = await response.json();
      console.log('📊 [ForgotPassword] Dados da resposta:', data);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('❌ [ForgotPassword] Erro na resposta:', errorData);
        throw new Error(errorData.error || "Erro na verificação");
      }

      // ✅ O backend deve retornar userId se encontrou o usuário
      if (data.userId) {
        console.log('✅ [ForgotPassword] Usuário verificado:', data.userId);
        toast({
          title: "Sucesso",
          description: data.message || "Usuário verificado com sucesso"
        });
        navigate(`/reset-password?userId=${encodeURIComponent(data.userId)}`);
      } else {
        console.log('❌ [ForgotPassword] userId não encontrado na resposta');
        throw new Error(data.error || "CPF não encontrado");
      }
    } catch (error: any) {
      console.error('💥 [ForgotPassword] Erro capturado:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro na verificação. Tente novamente.",
        variant: "destructive"
      });
    }
  
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center text-primary">
                Esqueci minha senha
              </CardTitle>
              <CardDescription className="text-center">
                Digite seu CPF e tipo de usuário para redefinir sua senha
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="userType">Tipo de Usuário</Label>
                  <Select 
                    value={userType} 
                    onValueChange={(value) => setUserType(value as 'aluno' | 'professor')}
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

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Verificando..." : "Verificar CPF"}
                </Button>

                <div className="text-center space-y-2">
                  <Button 
                    variant="link" 
                    onClick={() => navigate('/login')}
                    className="text-primary"
                  >
                    Voltar ao login
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

export default ForgotPassword;