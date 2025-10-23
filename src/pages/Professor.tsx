import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useComments } from "@/hooks/useComments"; // Assuming this is for the comments tab
import Header from "@/components/Header";
import QuestionnaireUpload from "@/components/QuestionnaireUpload";
import QuestionForm from "@/components/QuestionForm";
import TeacherLinkCode from "@/components/TeacherLinkCode";
import ChatWindow from "@/components/ChatWindow";
import { Users, FileText, BarChart3, Plus, Edit, Link, MessageCircle, Eye } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Student {
  nomeCompleto: string;
  cpf: string;
  idade: number;
  genero: string;
  corPele: string;
  escolaridade: string;
  telefone: string;
  score: number;
  rank: string;
}

interface Question {
  id: string;
  theme: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  feedback: {
    title: string;
    text: string;
    illustration: string;
  };
  createdBy?: string;
  visibility: 'public' | 'private';
}

const Professor = () => {
  const { user } = useAuth(); // Removed getAuthToken as apiFetch handles it
  const { toast } = useToast();
  // TODO: The useComments hook needs a valid question ID to fetch comments.
  // Passing a user ID might not be correct. This needs review.
  const { comments } = useComments(user?.uid || '');
  const userId = user?.uid || 'guest';

  const [students, setStudents] = useState<Student[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chattingWith, setChattingWith] = useState<{id: string, name: string, type: 'aluno' | 'professor'} | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStudents = useCallback(async () => {
    if (!user) return;
    try {
      const response = await apiFetch('/students_data');
      if (response.ok) {
        const data = await response.json();
        setStudents(Array.isArray(data) ? data : []);
      } else {
        throw new Error('Falha ao carregar alunos');
      }
    } catch (error) {
      console.error('Erro ao carregar estudantes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados dos estudantes.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  const loadQuestions = useCallback(async () => {
    if (!user) return;
    try {
      const response = await apiFetch('/questions');
      if (response.ok) {
        const data = await response.json();
        const questionsArray = Array.isArray(data) ? data : [];
        // The backend should ideally handle this filtering based on the authenticated user
        const filteredData = questionsArray.filter((q: Question) => q.createdBy === user.uid);
        setQuestions(filteredData);
      } else {
        throw new Error('Falha ao carregar perguntas');
      }
    } catch (error) {
      console.error('Erro ao carregar perguntas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as perguntas.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([loadStudents(), loadQuestions()]).finally(() => {
        setLoading(false);
      });
    }
  }, [user, loadStudents, loadQuestions]);

  const getRank = (score: number) => {
    const ranks = [
        { score: 0, title: "Aluno Novo (Iniciante)" },
        { score: 1, title: "Cordão Cru (Iniciante)" },
        { score: 3, title: "Cordão Amarelo (Estagiário)" },
        { score: 5, title: "Cordão Laranja (Graduado)" },
        { score: 8, title: "Cordão Azul (Instrutor)" },
        { score: 12, title: "Cordão Verde (Professor)" },
        { score: 18, title: "Cordão Roxo (Mestre)" },
        { score: 25, title: "Cordão Marrom (Contramestre)" },
        { score: 35, title: "Cordão Vermelho (Mestre)" }
      ];
  
      let currentRank = ranks[0].title;
      for (let rank of ranks) {
        if (score >= rank.score) currentRank = rank.title;
        else break;
      }
      return currentRank;
  }

  const toggleVisibility = async (questionId: string, currentVisibility: 'public' | 'private') => {
    const newVisibility = currentVisibility === 'public' ? 'private' : 'public';
    try {
      const response = await apiFetch('/questions/visibility', {
        method: 'PATCH',
        body: JSON.stringify({ 
          questionId, 
          visibility: newVisibility
        })
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: `Questão alterada para ${newVisibility === 'public' ? 'público' : 'privado'}`,
        });
        loadQuestions(); // Recarregar para refletir a mudança
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao alterar visibilidade');
      }
    } catch (error: any) {
      console.error('Erro ao alterar visibilidade:', error);
      toast({
        title: "Erro ao alterar visibilidade",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteQuestion = async (theme: string, question: string) => {
    if (!confirm('Tem certeza que deseja excluir esta pergunta?')) return;

    try {
      const response = await apiFetch('/delete_question', {
        method: 'POST',
        body: JSON.stringify({ theme, question })
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Pergunta excluída com sucesso",
        });
        loadQuestions(); // Recarregar para refletir a mudança
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir pergunta');
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const groupedQuestions = questions.reduce((acc, question) => {
    if (!acc[question.theme]) {
      acc[question.theme] = [];
    }
    acc[question.theme].push(question);
    return acc;
  }, {} as Record<string, Question[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto py-8 px-4">
          <div className="text-center">Carregando dados do professor...</div>
        </div>
      </div>
    );
  }

  // Renderização do componente (o JSX permanece o mesmo)
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-purple-600 mb-2">
            Área do Professor
          </h1>
          <p className="text-gray-600">
            Gerencie questionários, visualize dados dos alunos e faça upload de novos conteúdos
          </p>
        </div>

        <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
             <TabsTrigger value="upload" className="flex items-center gap-2">
               <FileText className="w-4 h-4" />
               Upload XML
             </TabsTrigger>
             <TabsTrigger value="add" className="flex items-center gap-2">
               <Plus className="w-4 h-4" />
               Adicionar
             </TabsTrigger>
            <TabsTrigger value="edit" className="flex items-center gap-2">
               <Edit className="w-4 h-4" />
               Editar
             </TabsTrigger>
            <TabsTrigger value="questions" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Questionários
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Alunos
            </TabsTrigger>
             <TabsTrigger value="link" className="flex items-center gap-2">
               <Link className="w-4 h-4" />
               Vinculação
             </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-2">
               <MessageCircle className="w-4 h-4" />
               Comentários
             </TabsTrigger>
           </TabsList>

          <TabsContent value="upload">
            <QuestionnaireUpload />
          </TabsContent>

          <TabsContent value="add">
            <QuestionForm mode="create" onSuccess={loadQuestions} />
          </TabsContent>

          <TabsContent value="edit">
            <Card>
              <CardHeader>
                <CardTitle>Editar Questionários</CardTitle>
                <CardDescription>
                  Selecione um questionário para editar
                </CardDescription>
              </CardHeader>
              <CardContent>
                {editingQuestion ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Editando Questionário</h3>
                      <Button
                        variant="outline"
                        onClick={() => setEditingQuestion(null)}
                      >
                        Voltar à Lista
                      </Button>
                    </div>
                    <QuestionForm 
                      mode="edit" 
                      question={editingQuestion} 
                      onSuccess={() => {
                        loadQuestions();
                        setEditingQuestion(null);
                      }} 
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedQuestions).map(([theme, themeQuestions]) => (
                      <div key={theme} className="border rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-purple-600 mb-3 capitalize">
                          {theme} ({themeQuestions.length} perguntas)
                        </h3>
                        <div className="space-y-2">
                        {themeQuestions.map((question) => (
                            <div key={question.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium">{question.question}</p>
                                  <Badge 
                                    variant={question.visibility === 'public' ? 'default' : 'secondary'}
                                    className="cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => toggleVisibility(question.id, question.visibility)}
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    {question.visibility === 'public' ? 'Público' : 'Privado'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600">
                                  {question.options.length} opções | Resposta: {question.options[question.correctOptionIndex]}
                                </p>
                              </div>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => setEditingQuestion(question)}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    {Object.keys(groupedQuestions).length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Edit className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-medium mb-2">Nenhum questionário para editar</p>
                        <p>Crie questionários primeiro para poder editá-los aqui.</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions">
            <Card>
              <CardHeader>
                <CardTitle>Meus Questionários</CardTitle>
                <CardDescription>
                  {questions.length} perguntas em {Object.keys(groupedQuestions).length} temas criados por você
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(groupedQuestions).map(([theme, themeQuestions]) => (
                    <div key={theme} className="border rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-purple-600 mb-3 capitalize">
                        {theme} ({themeQuestions.length} perguntas)
                      </h3>
                      <div className="space-y-2">
                         {themeQuestions.map((question, index) => (
                          <div key={question.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium">{question.question}</p>
                                <Badge 
                                  variant={question.visibility === 'public' ? 'default' : 'secondary'}
                                  className="cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => toggleVisibility(question.id, question.visibility)}
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  {question.visibility === 'public' ? 'Público' : 'Privado'}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">
                                {question.options.length} opções | Resposta: {question.options[question.correctOptionIndex]}
                              </p>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteQuestion(question.theme, question.question)}
                            >
                              Excluir
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  {Object.keys(groupedQuestions).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum questionário encontrado. Faça upload de um arquivo XML para começar.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>Dados dos Alunos</CardTitle>
                <CardDescription>
                  {students.length} alunos cadastrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>CPF</TableHead>
                        <TableHead>Idade</TableHead>
                        <TableHead>Gênero</TableHead>
                        <TableHead>Escolaridade</TableHead>
                        <TableHead>Pontuação</TableHead>
                        <TableHead>Graduação</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{student.nomeCompleto}</TableCell>
                          <TableCell>{student.cpf}</TableCell>
                          <TableCell>{student.idade}</TableCell>
                          <TableCell>{student.genero}</TableCell>
                          <TableCell>{student.escolaridade}</TableCell>
                          <TableCell>{student.score || 0}</TableCell>
                          <TableCell>{getRank(student.score || 0)}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setChattingWith({
                                  id: student.cpf, 
                                  name: student.nomeCompleto,
                                  type: 'aluno'
                                });
                                setIsChatOpen(true);
                              }}
                            >
                              <MessageCircle className="w-4 h-4 mr-1" />
                              Chat
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {students.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum aluno cadastrado ainda.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="link">
            <TeacherLinkCode />
          </TabsContent>

          <TabsContent value="comments">
            <Card>
              <CardHeader>
                <CardTitle>Comentários dos Alunos</CardTitle>
                <CardDescription>
                  Visualize e responda aos comentários dos seus alunos sobre os questionários
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* This section might need review as the useComments hook logic was unclear */}
                {comments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-2">Nenhum comentário ainda</p>
                    <p>Os comentários dos alunos sobre suas questões aparecerão aqui</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* The structure of the comment object was not available, this is a guess */}
                    {comments.map((comment: any) => (
                      <div key={comment.id} className="border rounded-lg p-4">
                         <div className="flex items-start justify-between mb-3">
                           <div>
                             <h4 className="font-medium text-purple-600">{comment.questionTheme || 'Tema Desconhecido'}</h4>
                             <p className="text-sm text-gray-600 mb-2">{comment.questionText || 'Questão não especificada'}</p>
                             <div className="flex items-center gap-2">
                               <Badge variant="secondary">{comment.userName || 'Usuário Desconhecido'}</Badge>
                               <span className="text-xs text-gray-500">
                                {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString('pt-BR') : 'Data desconhecida'}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                               setChattingWith({
                                id: comment.userId,
                                name: comment.userName,
                                type: 'aluno'
                              });
                               setIsChatOpen(true);
                            }}
                          >
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Responder
                          </Button>
                        </div>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded">{comment.message || comment.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ChatWindow
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          setChattingWith(null);
        }}
        onMinimize={() => setIsChatOpen(false)}
        chattingWith={chattingWith}
      />
    </div>
  );
};

export default Professor;
