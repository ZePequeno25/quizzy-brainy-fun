import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useComments } from "@/hooks/useComments";
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
  const { user, getAuthToken } = useAuth();
  const { toast } = useToast();
  const { comments } = useComments();
  const userId = user?.uid || 'guest';
  
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem(`students_${userId}`);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [questions, setQuestions] = useState<Question[]>(() => {
    const saved = localStorage.getItem(`questions_${userId}`);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(() => {
    const saved = localStorage.getItem(`editingQuestion_${userId}`);
    return saved ? JSON.parse(saved) : null;
  });
  
  const [isChatOpen, setIsChatOpen] = useState(() => localStorage.getItem(`isChatOpen_${userId}`) === 'true');
  
  const [chattingWith, setChattingWith] = useState<{id: string, name: string, type: 'aluno' | 'professor'} | null>(() => {
    const saved = localStorage.getItem(`chattingWith_${userId}`);
    return saved ? JSON.parse(saved) : null;
  });
  
  const [loading, setLoading] = useState(true);
  
  // useEffect para persistir estados
  useEffect(() => {
    if (user) {
      localStorage.setItem(`students_${userId}`, JSON.stringify(students));
      localStorage.setItem(`questions_${userId}`, JSON.stringify(questions));
      localStorage.setItem(`editingQuestion_${userId}`, JSON.stringify(editingQuestion));
      localStorage.setItem(`isChatOpen_${userId}`, isChatOpen.toString());
      localStorage.setItem(`chattingWith_${userId}`, JSON.stringify(chattingWith));
    }
  }, [students, questions, editingQuestion, isChatOpen, chattingWith, userId, user]);

  const loadStudents = async () => {
    try {
      const response = await apiFetch('/students_data');
      if (response.ok) {
        const data = await response.json();
        // Validação defensiva: garantir que data é um array
        const studentsArray = Array.isArray(data) ? data : [];
        setStudents(studentsArray);
        localStorage.setItem(`students_${userId}`, JSON.stringify(studentsArray));
      }
    } catch (error) {
      console.error('Erro ao carregar estudantes:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados dos estudantes",
        variant: "destructive",
      });
    }
  };

  const loadQuestions = async () => {
    try {
      const response = await apiFetch('/questions');
      if (response.ok) {
        const data = await response.json();
        // Validação defensiva: garantir que data é um array
        const questionsArray = Array.isArray(data) ? data : [];
        // Filtrar apenas perguntas do professor logado
        const filteredData = questionsArray.filter((q: Question) => q.createdBy === user?.uid);
        setQuestions(filteredData);
        localStorage.setItem(`questions_${userId}`, JSON.stringify(filteredData));
      }
    } catch (error) {
      console.error('Erro ao carregar perguntas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar perguntas",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadStudents(), loadQuestions()]);
      setLoading(false);
    };
    
    loadData();
  }, []);

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
  };

  /**
   * ==================== FUNÇÃO DE ALTERAÇÃO DE VISIBILIDADE ====================
   * 
   * OBJETIVO:
   * Permite ao professor alterar a visibilidade de uma questão entre 'public' e 'private'
   * 
   * PARÂMETROS RECEBIDOS:
   * @param questionId - ID único da questão (string) - Ex: "TmWNn0IhxJHX2Ik58nDz"
   * @param currentVisibility - Visibilidade atual da questão ('public' | 'private')
   * 
   * FLUXO DA FUNÇÃO:
   * 1. Valida se existe token de autenticação JWT do professor
   * 2. Inverte a visibilidade atual (public -> private ou private -> public)
   * 3. Faz requisição PATCH para o backend
   * 4. Se sucesso: mostra toast de sucesso e recarrega as questões
   * 5. Se erro: mostra toast com mensagem de erro detalhada
   * 
   * ==================== ENDPOINT DO BACKEND NECESSÁRIO ====================
   * 
   * URL: https://aprender-em-movimento.onrender.com/api/questions/visibility
   * MÉTODO: PATCH
   * 
   * HEADERS NECESSÁRIOS:
   * - Content-Type: application/json
   * - Authorization: Bearer {token_jwt_do_professor}
   * 
   * BODY DA REQUISIÇÃO (JSON):
   * {
   *   "questionId": "string",      // ID único da questão (Ex: "TmWNn0IhxJHX2Ik58nDz")
   *   "visibility": "string"       // Novo valor: "public" ou "private"
   * }
   * 
   * EXEMPLO DE BODY:
   * {
   *   "questionId": "TmWNn0IhxJHX2Ik58nDz",
   *   "visibility": "private"
   * }
   * 
   * ==================== RESPOSTA ESPERADA DO BACKEND ====================
   * 
   * SUCESSO (Status 200):
   * {
   *   "message": "Visibilidade alterada com sucesso",
   *   "questionId": "TmWNn0IhxJHX2Ik58nDz",
   *   "visibility": "private"
   * }
   * 
   * ERRO (Status 400/401/404/500):
   * {
   *   "error": "Descrição do erro"
   * }
   * 
   * ==================== O QUE O BACKEND DEVE FAZER ====================
   * 
   * 1. VALIDAR TOKEN:
   *    - Verificar se o token JWT é válido
   *    - Extrair o uid do professor do token
   *    - Retornar 401 se token inválido
   * 
   * 2. VALIDAR PERMISSÕES:
   *    - Verificar se a questão com questionId existe
   *    - Verificar se a questão foi criada pelo professor logado (campo createdBy)
   *    - Retornar 403 se o professor não for o dono da questão
   * 
   * 3. VALIDAR DADOS:
   *    - Verificar se questionId foi fornecido
   *    - Verificar se visibility é "public" ou "private"
   *    - Retornar 400 se dados inválidos
   * 
   * 4. ATUALIZAR NO BANCO DE DADOS:
   *    - Buscar a questão pelo questionId no Firestore
   *    - Atualizar o campo "visibility" com o novo valor
   *    - Manter todos os outros campos inalterados
   * 
   * 5. RETORNAR RESPOSTA:
   *    - Status 200 com mensagem de sucesso
   *    - Incluir questionId e nova visibility na resposta
   * 
   * ==================== ESTRUTURA DA QUESTÃO NO BANCO ====================
   * 
   * interface Question {
   *   id: string;                    // ID único da questão
   *   theme: string;                 // Tema da questão (ex: "tecnologia")
   *   question: string;              // Texto da pergunta
   *   options: string[];             // Array de opções de resposta
   *   correctOptionIndex: number;    // Índice da resposta correta (0-3)
   *   feedback: {                    // Objeto de feedback
   *     title: string;               // Título do feedback
   *     text: string;                // Texto explicativo
   *     illustration: string;        // URL da imagem
   *   };
   *   createdBy: string;             // UID do professor que criou (IMPORTANTE!)
   *   visibility: 'public' | 'private';  // Campo a ser atualizado
   * }
   * 
   * ==================== EXEMPLO DE IMPLEMENTAÇÃO (Python/Flask) ====================
   * 
   * @app.route('/api/questions/visibility', methods=['PATCH'])
   * def update_question_visibility():
   *     # 1. Pegar token do header
   *     token = request.headers.get('Authorization', '').replace('Bearer ', '')
   *     
   *     # 2. Validar token e extrair uid do professor
   *     try:
   *         decoded_token = auth.verify_id_token(token)
   *         professor_uid = decoded_token['uid']
   *     except:
   *         return jsonify({'error': 'Token inválido'}), 401
   *     
   *     # 3. Pegar dados do body
   *     data = request.json
   *     question_id = data.get('questionId')
   *     new_visibility = data.get('visibility')
   *     
   *     # 4. Validar dados
   *     if not question_id or new_visibility not in ['public', 'private']:
   *         return jsonify({'error': 'Dados inválidos'}), 400
   *     
   *     # 5. Buscar questão no Firestore
   *     question_ref = db.collection('questions').document(question_id)
   *     question = question_ref.get()
   *     
   *     if not question.exists:
   *         return jsonify({'error': 'Questão não encontrada'}), 404
   *     
   *     # 6. Verificar se professor é dono da questão
   *     question_data = question.to_dict()
   *     if question_data.get('createdBy') != professor_uid:
   *         return jsonify({'error': 'Sem permissão para alterar esta questão'}), 403
   *     
   *     # 7. Atualizar visibilidade
   *     question_ref.update({
   *         'visibility': new_visibility
   *     })
   *     
   *     # 8. Retornar sucesso
   *     return jsonify({
   *         'message': 'Visibilidade alterada com sucesso',
   *         'questionId': question_id,
   *         'visibility': new_visibility
   *     }), 200
   * 
   * ==================== CÓDIGO DA FUNÇÃO (FRONTEND) ====================
   */
  const toggleVisibility = async (questionId: string, currentVisibility: 'public' | 'private') => {
    // 1. Obter token JWT de autenticação do professor
    const token = getAuthToken();
    if (!token) {
      toast({
        title: "Erro",
        description: "Token de autenticação não encontrado",
        variant: "destructive",
      });
      return;
    }

    // 2. Inverter a visibilidade atual
    const newVisibility = currentVisibility === 'public' ? 'private' : 'public';

    // Log para debug
    console.log('Tentando alterar visibilidade:', { questionId, currentVisibility, newVisibility });

    try {
      // 3. Fazer requisição PATCH para o backend
      const response = await apiFetch('/questions/visibility', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          questionId,           // ID da questão
          visibility: newVisibility  // Nova visibilidade
        })
      });

      // Log da resposta para debug
      console.log('Resposta do servidor:', response.status, response.statusText);

      // 4. Verificar se a requisição foi bem-sucedida
      if (response.ok) {
        // 4a. Sucesso: mostrar notificação e recarregar questões
        toast({
          title: "Sucesso",
          description: `Questão alterada para ${newVisibility === 'public' ? 'público' : 'privado'}`,
        });
        // Recarrega todas as questões do professor para atualizar a interface
        loadQuestions();
      } else {
        // 4b. Erro: capturar mensagem de erro do backend
        const errorData = await response.text();
        console.error('Erro na resposta:', errorData);
        throw new Error(`Erro ${response.status}: ${errorData}`);
      }
    } catch (error) {
      // 5. Tratamento de erros (rede, servidor, etc)
      console.error('Erro ao alterar visibilidade:', error);
      toast({
        title: "Erro ao alterar visibilidade",
        description: error instanceof Error ? error.message : "O endpoint de visibilidade não está disponível no backend. Contate o desenvolvedor.",
        variant: "destructive",
      });
    }
  };

  const deleteQuestion = async (theme: string, question: string) => {
    const token = getAuthToken();
    if (!token) return;

    if (!confirm('Tem certeza que deseja excluir esta pergunta?')) return;

    try {
      const response = await apiFetch('/delete_question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ theme, question })
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Pergunta excluída com sucesso",
        });
        loadQuestions();
      } else {
        throw new Error('Erro ao excluir pergunta');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir pergunta",
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
          <div className="text-center">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto py-4 sm:py-8 px-4">
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-purple-600 mb-2">
            Área do Professor
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Gerencie questionários, visualize dados dos alunos e faça upload de novos conteúdos
          </p>
        </div>

        <Tabs defaultValue="upload" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 h-auto gap-1">
            <TabsTrigger value="upload" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Upload XML</span>
              <span className="sm:hidden">XML</span>
            </TabsTrigger>
            <TabsTrigger value="add" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Adicionar</span>
              <span className="sm:hidden">Add</span>
            </TabsTrigger>
            <TabsTrigger value="edit" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm">
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline">Editar</span>
              <span className="sm:hidden">Edit</span>
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Questionários</span>
              <span className="sm:hidden">Quest.</span>
            </TabsTrigger>
            <TabsTrigger value="students" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Alunos</span>
              <span className="sm:hidden">Alunos</span>
            </TabsTrigger>
            <TabsTrigger value="link" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm">
              <Link className="w-4 h-4" />
              <span className="hidden sm:inline">Vinculação</span>
              <span className="sm:hidden">Link</span>
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 text-xs sm:text-sm">
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Comentários</span>
              <span className="sm:hidden">Msgs</span>
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
                                  id: student.cpf, // Usando CPF como ID temporário
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
                {comments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-2">Nenhum comentário ainda</p>
                    <p>Os comentários dos alunos sobre suas questões aparecerão aqui</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-purple-600">{comment.questionTheme}</h4>
                            <p className="text-sm text-gray-600 mb-2">{comment.questionText}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{comment.userName}</Badge>
                              <span className="text-xs text-gray-500">
                                {new Date(comment.createdAt).toLocaleDateString('pt-BR')}
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
                        <p className="text-gray-700 bg-gray-50 p-3 rounded">{comment.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Chat Window */}
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