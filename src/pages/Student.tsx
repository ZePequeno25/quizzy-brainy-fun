import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTeacherStudent } from "@/hooks/useTeacherStudent";
import Header from "@/components/Header";
import StudentLinkForm from "@/components/StudentLinkForm";
import QuestionComments from "@/components/QuestionComments";
import ChatWindow from "@/components/ChatWindow";
import { Play, Trophy, Clock, CheckCircle, Pause, RotateCcw, Link, MessageCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";

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

const Student = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { relations } = useTeacherStudent();
  const userId = user?.uid || 'guest';
  
  const [questions, setQuestions] = useState<Question[]>(() => {
    const saved = localStorage.getItem(`questions_${userId}`);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [quizQuestions, setQuizQuestions] = useState<Question[]>(() => {
    const saved = localStorage.getItem(`quizQuestions_${userId}`);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isChatOpen, setIsChatOpen] = useState(() => localStorage.getItem(`isChatOpen_${userId}`) === 'true');
  
  const [chattingWith, setChattingWith] = useState<{id: string, name: string, type: 'aluno' | 'professor'} | null>(() => {
    const saved = localStorage.getItem(`chattingWith_${userId}`);
    return saved ? JSON.parse(saved) : null;
  });
  
  // Estados do quiz persistidos
  const [quizState, setQuizState] = useState(() => {
    const saved = localStorage.getItem(`quizState_${userId}`);
    return saved ? JSON.parse(saved) : {
      score: 0,
      questionIndex: 0,
      isQuizActive: false,
      showFeedback: false,
      selectedTheme: "all",
      selectedVisibility: "public",
      selectedTeacher: "all",
      timeLeft: 20,
      isPaused: false
    };
  });
  
  const [score, setScore] = useState(quizState.score);
  const [questionIndex, setQuestionIndex] = useState(quizState.questionIndex);
  const [isQuizActive, setIsQuizActive] = useState(quizState.isQuizActive);
  const [showFeedback, setShowFeedback] = useState(quizState.showFeedback);
  const [selectedTheme, setSelectedTheme] = useState(quizState.selectedTheme);
  const [selectedVisibility, setSelectedVisibility] = useState(quizState.selectedVisibility);
  const [selectedTeacher, setSelectedTeacher] = useState(quizState.selectedTeacher);
  const [timeLeft, setTimeLeft] = useState(quizState.timeLeft);
  const [isPaused, setIsPaused] = useState(quizState.isPaused);
  
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  
  // useEffect para persistir estados
  useEffect(() => {
    if (user) {
      localStorage.setItem(`questions_${userId}`, JSON.stringify(questions));
      localStorage.setItem(`quizQuestions_${userId}`, JSON.stringify(quizQuestions));
      localStorage.setItem(`isChatOpen_${userId}`, isChatOpen.toString());
      localStorage.setItem(`chattingWith_${userId}`, JSON.stringify(chattingWith));
      localStorage.setItem(`quizState_${userId}`, JSON.stringify({
        score, questionIndex, isQuizActive, showFeedback, selectedTheme, selectedVisibility, selectedTeacher, timeLeft, isPaused
      }));
    }
  }, [questions, quizQuestions, isChatOpen, chattingWith, score, questionIndex, isQuizActive, showFeedback, selectedTheme, selectedVisibility, selectedTeacher, timeLeft, isPaused, userId, user]);

  const capoeiraRanks = [
    { score: 0, title: "Aluno Novo (Iniciante)", color: "bg-gray-400" },
    { score: 1, title: "Cordão Cru (Iniciante)", color: "bg-yellow-200" },
    { score: 3, title: "Cordão Amarelo (Estagiário)", color: "bg-yellow-400" },
    { score: 5, title: "Cordão Laranja (Graduado)", color: "bg-orange-400" },
    { score: 8, title: "Cordão Azul (Instrutor)", color: "bg-blue-400" },
    { score: 12, title: "Cordão Verde (Professor)", color: "bg-green-400" },
    { score: 18, title: "Cordão Roxo (Mestre)", color: "bg-purple-400" },
    { score: 25, title: "Cordão Marrom (Contramestre)", color: "bg-amber-600" },
    { score: 35, title: "Cordão Vermelho (Mestre)", color: "bg-red-500" }
  ];

  const getCurrentRank = (userScore: number) => {
    let currentRank = capoeiraRanks[0];
    for (let rank of capoeiraRanks) {
      if (userScore >= rank.score) currentRank = rank;
      else break;
    }
    return currentRank;
  };

  const loadQuestions = async () => {
    try {
      const response = await apiFetch('/questions');
      if (response.ok) {
        const data = await response.json();
        
        // Validação defensiva: garantir que data é um array
        const dataArray = Array.isArray(data) ? data : [];
        
        // Filtrar questões baseado na visibilidade selecionada
        let filteredQuestions = dataArray;
        
        if (selectedVisibility === "teachers" && selectedTeacher !== "all") {
          // Mostrar apenas questões do professor selecionado
          filteredQuestions = dataArray.filter((q: Question) => 
            q.createdBy === selectedTeacher && q.visibility === 'private'
          );
        } else if (selectedVisibility === "public") {
          // Mostrar apenas questões públicas
          filteredQuestions = dataArray.filter((q: Question) => q.visibility === 'public');
        }
        
        setQuestions(filteredQuestions);
        localStorage.setItem(`questions_${userId}`, JSON.stringify(filteredQuestions));
      } else {
        throw new Error('Falha na requisição');
      }
    } catch (error) {
      console.error('Erro ao carregar perguntas:', error);
      // Fallback com dados mockados para demonstração
      const mockQuestions = [
        {
          id: 'mock1',
          theme: 'capoeira',
          question: 'Qual é o instrumento principal da capoeira?',
          options: ['Berimbau', 'Pandeiro', 'Atabaque', 'Caxixi'],
          correctOptionIndex: 0,
          feedback: {
            title: 'Correto!',
            text: 'O berimbau é o instrumento principal que conduz a roda de capoeira.',
            illustration: ''
          },
          visibility: 'public' as const
        },
        {
          id: 'mock2',
          theme: 'tecnologia',
          question: 'O que significa HTML?',
          options: ['HyperText Markup Language', 'Home Tool Markup Language', 'Hyperlinks and Text Markup Language', 'High Tech Modern Language'],
          correctOptionIndex: 0,
          feedback: {
            title: 'Parabéns!',
            text: 'HTML é a linguagem de marcação padrão para criar páginas web.',
            illustration: ''
          },
          visibility: 'public' as const
        }
      ];
      setQuestions(mockQuestions);
      toast({
        title: "Modo Demonstração",
        description: "Carregando perguntas de exemplo pois a API está indisponível.",
      });
    }
  };

  useEffect(() => {
    loadQuestions();
    if (user?.score) {
      setScore(user.score);
    }
  }, [user, selectedVisibility, selectedTeacher]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isQuizActive && timeLeft > 0 && !showFeedback && !isPaused) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && !showFeedback) {
      handleAnswer();
    }
    return () => clearTimeout(timer);
  }, [timeLeft, isQuizActive, showFeedback, isPaused]);

  const startQuiz = () => {
    let filteredQuestions = questions;
    
    if (selectedTheme && selectedTheme !== "all") {
      filteredQuestions = questions.filter(q => q.theme === selectedTheme);
    }
    
    if (filteredQuestions.length === 0) {
      toast({
        title: "Erro",
        description: "Nenhuma pergunta encontrada para o tema selecionado",
        variant: "destructive",
      });
      return;
    }

    // Embaralhar perguntas
    const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5);
    setQuizQuestions(shuffled);
    setCurrentQuestion(shuffled[0]);
    setQuestionIndex(0);
    setSelectedOption(null);
    setIsQuizActive(true);
    setShowFeedback(false);
    setTimeLeft(20);
    setIsPaused(false);
  };

  const handleAnswer = () => {
    if (!currentQuestion) return;

    const isCorrect = selectedOption === currentQuestion.correctOptionIndex;
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    
    setShowFeedback(true);
  };

  const nextQuestion = () => {
    const nextIndex = questionIndex + 1;
    
    if (nextIndex < quizQuestions.length) {
      setQuestionIndex(nextIndex);
      setCurrentQuestion(quizQuestions[nextIndex]);
      setSelectedOption(null);
      setShowFeedback(false);
      setTimeLeft(20);
    } else {
      endQuiz();
    }
  };

  const endQuiz = () => {
    setIsQuizActive(false);
    setCurrentQuestion(null);
    setShowFeedback(false);
    setIsPaused(false);
    
    const finalRank = getCurrentRank(score);
    
    toast({
      title: "Quiz concluído!",
      description: `Pontuação: ${score} | Graduação: ${finalRank.title}`,
    });
  };

  const pauseQuiz = () => {
    setIsPaused(!isPaused);
  };

  const resetQuiz = () => {
    if (confirm('Tem certeza que deseja resetar o quiz? Todo o progresso será perdido.')) {
      setIsQuizActive(false);
      setCurrentQuestion(null);
      setShowFeedback(false);
      setIsPaused(false);
      setQuestionIndex(0);
      setSelectedOption(null);
      setQuizQuestions([]);
    }
  };

  const themes = [...new Set(questions.map(q => q.theme))];
  const currentRank = getCurrentRank(score);

  if (!user) {
    return <div>Acesso negado</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-purple-600 mb-2">
            Área do Aluno
          </h1>
          <p className="text-gray-600">
            Bem-vindo, {user.nomeCompleto.split(' ')[0]}!
          </p>
        </div>

        <Tabs defaultValue="quiz" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quiz" className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Quiz
            </TabsTrigger>
            <TabsTrigger value="link" className="flex items-center gap-2">
              <Link className="w-4 h-4" />
              Professores
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quiz">
            <div className="grid lg:grid-cols-3 gap-8">
          {/* Painel do usuário */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Seu Progresso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Pontuação Atual</p>
                  <p className="text-2xl font-bold">{score}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-2">Graduação Atual</p>
                  <div className={`p-3 rounded-lg ${currentRank.color} text-white text-center font-semibold`}>
                    {currentRank.title}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Progresso para próxima graduação</p>
                  <Progress 
                    value={Math.min((score / (currentRank.score + 3)) * 100, 100)} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Graduações disponíveis */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Sistema de Graduação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {capoeiraRanks.map((rank, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className={`w-4 h-4 rounded ${rank.color}`}></div>
                      <span className={score >= rank.score ? 'font-semibold' : 'text-gray-500'}>
                        {rank.title} ({rank.score}+ pontos)
                      </span>
                      {score >= rank.score && <CheckCircle className="w-4 h-4 text-green-500" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Área do quiz */}
          <div className="lg:col-span-2">
            {!isQuizActive ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="w-5 h-5 text-purple-600" />
                    Iniciar Quiz
                  </CardTitle>
                  <CardDescription>
                    Configure seu quiz e escolha as opções de visibilidade
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Seletor de Visibilidade */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Fonte das Questões</label>
                    <Select value={selectedVisibility} onValueChange={setSelectedVisibility}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha a fonte das questões" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Questões Públicas</SelectItem>
                        {relations.length > 0 && (
                          <SelectItem value="teachers">Professores Vinculados</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Seletor de Professor (quando visibilidade = professores) */}
                  {selectedVisibility === "teachers" && relations.length > 0 && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Professor</label>
                      <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                        <SelectTrigger>
                          <SelectValue placeholder="Escolha um professor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os professores vinculados</SelectItem>
                          {relations.map((relation) => (
                            <SelectItem key={relation.teacherId} value={relation.teacherId}>
                              {relation.teacherName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Seletor de Tema */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tema (opcional)</label>
                    <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os temas (aleatório)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os temas (aleatório)</SelectItem>
                        {themes.map(theme => (
                          <SelectItem key={theme} value={theme}>
                            {theme.charAt(0).toUpperCase() + theme.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={startQuiz}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    size="lg"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Começar Quiz
                  </Button>

                  <div className="text-sm text-gray-600">
                    <p>• Cada pergunta tem 20 segundos para ser respondida</p>
                    <p>• Ganhe 1 ponto por resposta correta</p>
                    <p>• Avance nas graduações da capoeira conforme sua pontuação</p>
                    {selectedVisibility === "teachers" && (
                      <p>• Questões dos seus professores vinculados</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Pergunta {questionIndex + 1} de {quizQuestions.length}</span>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={pauseQuiz}
                          className="flex items-center gap-1"
                        >
                          {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                          {isPaused ? "Continuar" : "Pausar"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resetQuiz}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Resetar
                        </Button>
                      </div>
                      <div className={`flex items-center gap-2 ${isPaused ? 'text-orange-500' : 'text-red-500'}`}>
                        <Clock className="w-4 h-4" />
                        {timeLeft}s {isPaused && "(Pausado)"}
                      </div>
                    </div>
                  </CardTitle>
                  <Progress value={(questionIndex / quizQuestions.length) * 100} />
                </CardHeader>
                <CardContent>
                  {currentQuestion && !showFeedback && (
                    <div className="space-y-4">
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm text-purple-600 font-medium mb-1">
                          {currentQuestion.theme.toUpperCase()}
                        </p>
                        <h3 className="text-lg font-semibold">
                          {currentQuestion.question}
                        </h3>
                      </div>

                      <div className="space-y-2">
                        {currentQuestion.options.map((option, index) => (
                          <Button
                            key={index}
                            variant={selectedOption === index ? "default" : "outline"}
                            className={`w-full text-left p-4 h-auto justify-start ${
                              selectedOption === index 
                                ? "bg-purple-600 hover:bg-purple-700" 
                                : "hover:bg-purple-50"
                            }`}
                            onClick={() => setSelectedOption(index)}
                          >
                            <span className="font-semibold mr-2">{String.fromCharCode(65 + index)})</span>
                            {option}
                          </Button>
                        ))}
                      </div>

                      <Button 
                        onClick={handleAnswer}
                        disabled={selectedOption === null}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        Responder
                      </Button>
                    </div>
                  )}

                  {showFeedback && currentQuestion && (
                    <div className="space-y-4">
                      <div className={`p-4 rounded-lg ${
                        selectedOption === currentQuestion.correctOptionIndex 
                          ? "bg-green-50 border-green-200" 
                          : "bg-red-50 border-red-200"
                      } border`}>
                        <h3 className="text-lg font-semibold mb-2">
                          {selectedOption === currentQuestion.correctOptionIndex 
                            ? currentQuestion.feedback.title || "Correto!"
                            : "Ops, não foi dessa vez!"
                          }
                        </h3>
                        
                        {currentQuestion.feedback.illustration && (
                          <img 
                            src={currentQuestion.feedback.illustration} 
                            alt="Feedback"
                            className="w-full max-w-sm mx-auto mb-4 rounded"
                          />
                        )}
                        
                        <p>
                          {selectedOption === currentQuestion.correctOptionIndex 
                            ? currentQuestion.feedback.text || "Boa resposta!"
                            : `A resposta correta era: "${currentQuestion.options[currentQuestion.correctOptionIndex]}". ${currentQuestion.feedback.text || ""}`
                          }
                        </p>
                      </div>

                      <Button 
                        onClick={nextQuestion}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        {questionIndex + 1 < quizQuestions.length ? "Próxima Pergunta" : "Finalizar Quiz"}
                      </Button>

                      {/* Componente de Comentários */}
                      {currentQuestion && (
                        <QuestionComments
                          questionId={currentQuestion.id}
                          questionTheme={currentQuestion.theme}
                          questionText={currentQuestion.question}
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="link">
        <StudentLinkForm />
      </TabsContent>

      <TabsContent value="chat">
        <Card>
          <CardHeader>
            <CardTitle>Professores para Chat</CardTitle>
            <CardDescription>
              Inicie uma conversa com seus professores vinculados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {relations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">Nenhum professor vinculado</p>
                <p>Vincule-se a professores para iniciar conversas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {relations.map((relation) => (
                  <div key={relation.teacherId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{relation.teacherName}</h4>
                      <p className="text-sm text-gray-600">
                        Professor vinculado desde {new Date(relation.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        setChattingWith({
                          id: relation.teacherId,
                          name: relation.teacherName,
                          type: 'professor'
                        });
                        setIsChatOpen(true);
                      }}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Iniciar Chat
                    </Button>
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

export default Student;