import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

interface Comment {
  id: string;
  questionId: string;
  questionTheme: string;
  questionText: string;
  userId: string;
  userName: string;
  userType: 'aluno' | 'professor';
  message: string;
  createdAt: string;
  responses?: CommentResponse[];
}

interface CommentResponse {
  id: string;
  commentId: string;
  userId: string;
  userName: string;
  userType: 'aluno' | 'professor';
  message: string;
  createdAt: string;
}

export const useComments = () => {
  const { user, getAuthToken } = useAuth();
  const userId = user?.uid || 'guest';
  
  const [comments, setComments] = useState<Comment[]>(() => {
    const saved = localStorage.getItem(`comments_${userId}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    if (user) {
      localStorage.setItem(`comments_${userId}`, JSON.stringify(comments));
    }
  }, [comments, userId, user]);

  // Adicionar comentário a um questionário
  const addComment = async (questionId: string, questionTheme: string, questionText: string, message: string) => {
    if (!user || !message.trim()) return { success: false };
    
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await apiFetch('/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          questionId,
          questionTheme,
          questionText,
          userId: user.uid,
          userName: user.nomeCompleto,
          userType: user.userType,
          message: message.trim()
        })
      });

      if (response.ok) {
        toast({
          title: "Comentário adicionado!",
          description: "Seu comentário foi enviado com sucesso"
        });
        loadComments();
        return { success: true };
      } else {
        throw new Error('Erro ao enviar comentário');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar comentário",
        variant: "destructive"
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // Responder a um comentário
  const addResponse = async (commentId: string, message: string) => {
    if (!user || !message.trim()) return { success: false };
    
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await apiFetch('/comment-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          commentId,
          userId: user.uid,
          userName: user.nomeCompleto,
          userType: user.userType,
          message: message.trim()
        })
      });

      if (response.ok) {
        toast({
          title: "Resposta adicionada!",
          description: "Sua resposta foi enviada com sucesso"
        });
        loadComments();
        return { success: true };
      } else {
        throw new Error('Erro ao enviar resposta');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar resposta",
        variant: "destructive"
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // Carregar comentários (para alunos: seus comentários; para professores: comentários dos alunos vinculados)
  const loadComments = async () => {
    if (!user) {
      console.error('❌ [useComments] Usuário não autenticado');
      return;
    }
    
    try {
      const endpoint = user.userType === 'professor' 
        ? `/teacher-comments/${user.uid}`
        : `/student-comments/${user.uid}`;
      console.log(`📡 [useComments] Carregando comentários de ${endpoint}`);
      
      const token = await getAuthToken();
      console.log(`🔑 [useComments] Token JWT: ${token.substring(0, 10)}...`);
      
      const response = await apiFetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const commentsArray = Array.isArray(data.comments) ? data.comments : [];
        console.log(`✅ [useComments] ${commentsArray.length} comentários carregados`);
        setComments(commentsArray);
        localStorage.setItem(`comments_${userId}`, JSON.stringify(commentsArray));
      } else {
        console.error(`❌ [useComments] Erro na API: ${response.status} - ${endpoint}`);
        toast({
          title: "Erro",
          description: `Falha ao carregar comentários: ${response.statusText}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error(`❌ [useComments] Erro ao carregar comentários: ${error.message}`);
      toast({
        title: "Erro",
        description: "Erro ao carregar comentários",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (user) {
      loadComments();
    }
  }, [user]);

  return {
    comments,
    loading,
    addComment,
    addResponse,
    loadComments
  };
};