import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save } from "lucide-react";

interface Question {
  id?: string;
  theme: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  feedback: {
    title: string;
    text: string;
    illustration: string;
  };
}

interface QuestionFormProps {
  question?: Question;
  onSuccess?: () => void;
  mode: 'create' | 'edit';
}

const QuestionForm = ({ question, onSuccess, mode }: QuestionFormProps) => {
  const [theme, setTheme] = useState(question?.theme || '');
  const [questionText, setQuestionText] = useState(question?.question || '');
  const [options, setOptions] = useState(question?.options || ['', '']);
  const [correctOptionIndex, setCorrectOptionIndex] = useState(question?.correctOptionIndex || 0);
  const [feedbackTitle, setFeedbackTitle] = useState(question?.feedback.title || '');
  const [feedbackText, setFeedbackText] = useState(question?.feedback.text || '');
  const [feedbackIllustration, setFeedbackIllustration] = useState(question?.feedback.illustration || '');
  const [loading, setLoading] = useState(false);

  const { getAuthToken, user } = useAuth();
  const { toast } = useToast();

  const addOption = () => {
    setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      // Ajustar índice da resposta correta se necessário
      if (correctOptionIndex >= newOptions.length) {
        setCorrectOptionIndex(0);
      }
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!theme || !questionText || options.some(opt => !opt.trim()) || !feedbackTitle || !feedbackText) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const token = getAuthToken();

    try {
      const questionData = {
        theme,
        question: questionText,
        options: options.filter(opt => opt.trim()),
        correctOptionIndex,
        feedback: {
          title: feedbackTitle,
          text: feedbackText,
          illustration: feedbackIllustration
        },
        createdBy: user?.uid
      };

      const url = mode === 'create' 
        ? 'https://aprender-em-movimento.onrender.com/api/questions'
        : `https://aprender-em-movimento.onrender.com/api/questions/${question?.id}`;

      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(questionData)
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: mode === 'create' ? "Questionário criado com sucesso" : "Questionário atualizado com sucesso",
        });
        
        // Limpar formulário se for criação
        if (mode === 'create') {
          setTheme('');
          setQuestionText('');
          setOptions(['', '']);
          setCorrectOptionIndex(0);
          setFeedbackTitle('');
          setFeedbackText('');
          setFeedbackIllustration('');
        }
        
        onSuccess?.();
      } else {
        throw new Error('Erro ao salvar questionário');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar questionário",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'Criar Novo Questionário' : 'Editar Questionário'}
        </CardTitle>
        <CardDescription>
          {mode === 'create' 
            ? 'Preencha os campos abaixo para criar um novo questionário'
            : 'Edite os campos do questionário selecionado'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="theme">Tema *</Label>
            <Input
              id="theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="Ex: tecnologia, história, ciências..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="question">Pergunta *</Label>
            <Textarea
              id="question"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Digite a pergunta do questionário"
              required
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Opções de Resposta *</Label>
              <Button type="button" onClick={addOption} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Opção
              </Button>
            </div>
            
            {options.map((option, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Opção ${index + 1}`}
                  required
                />
                {options.length > 2 && (
                  <Button
                    type="button"
                    onClick={() => removeOption(index)}
                    size="sm"
                    variant="destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Resposta Correta *</Label>
            <Select value={correctOptionIndex.toString()} onValueChange={(value) => setCorrectOptionIndex(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a resposta correta" />
              </SelectTrigger>
              <SelectContent>
                {options.map((option, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    Opção {index + 1}: {option.substring(0, 30)}{option.length > 30 ? '...' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedbackTitle">Título do Feedback *</Label>
            <Input
              id="feedbackTitle"
              value={feedbackTitle}
              onChange={(e) => setFeedbackTitle(e.target.value)}
              placeholder="Ex: Correto!, Parabéns!, Muito bem!"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedbackText">Texto do Feedback *</Label>
            <Textarea
              id="feedbackText"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Explicação ou comentário sobre a resposta correta"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedbackIllustration">URL da Ilustração (opcional)</Label>
            <Input
              id="feedbackIllustration"
              value={feedbackIllustration}
              onChange={(e) => setFeedbackIllustration(e.target.value)}
              placeholder="https://exemplo.com/imagem.jpg"
              type="url"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Salvando...' : (mode === 'create' ? 'Criar Questionário' : 'Salvar Alterações')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default QuestionForm;