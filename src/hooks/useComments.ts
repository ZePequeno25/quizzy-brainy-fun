import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from './useAuth';

// Define the shape of a comment
interface Comment {
  id: string;
  questionId?: string;
  question_id?: string;
  questionTheme?: string;
  question_theme?: string;
  questionText?: string;
  question_text?: string;
  userId?: string;
  user_id?: string;
  userName?: string;
  user_name?: string;
  userType?: 'aluno' | 'professor';
  user_type?: 'aluno' | 'professor';
  message: string;
  createdAt?: string;
  created_at?: string;
  responses?: Response[];
}

// Define the shape of a response
interface Response {
  id: string;
  commentId?: string;
  comment_id?: string;
  userId?: string;
  user_id?: string;
  userName?: string;
  user_name?: string;
  userType?: 'aluno' | 'professor';
  user_type?: 'aluno' | 'professor';
  message: string;
  createdAt?: string;
  created_at?: string;
}

// Normalize comment data from API to frontend format
const normalizeComment = (comment: any): Comment => {
  // Debug: log original comment to see what we're receiving
  if (!comment.question_theme && !comment.questionTheme) {
    console.warn('⚠️ [useComments] Comentário sem question_theme:', comment);
  }
  if (!comment.user_name && !comment.userName) {
    console.warn('⚠️ [useComments] Comentário sem user_name:', comment);
  }
  
  return {
    id: comment.id,
    questionId: comment.question_id || comment.questionId,
    questionTheme: comment.question_theme || comment.questionTheme || '',
    questionText: comment.question_text || comment.questionText || '',
    userId: comment.user_id || comment.userId,
    userName: comment.user_name || comment.userName || '',
    userType: (comment.user_type || comment.userType) as 'aluno' | 'professor',
    message: comment.message || '',
    createdAt: comment.created_at || comment.createdAt,
    responses: (comment.responses || []).map((r: any) => ({
      id: r.id,
      commentId: r.comment_id || r.commentId,
      userId: r.user_id || r.userId,
      userName: r.user_name || r.userName || '',
      userType: (r.user_type || r.userType) as 'aluno' | 'professor',
      message: r.message || '',
      createdAt: r.created_at || r.createdAt,
    })),
  };
};

export const useComments = () => {
  const { user, loading: authLoading } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch comments based on user type
  const fetchComments = useCallback(async () => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let endpoint = '';
      if (user.userType === 'professor') {
        endpoint = `/teacher-comments/${user.uid}`;
      } else {
        endpoint = `/student-comments/${user.uid}`;
      }

      const response = await apiFetch(endpoint);
      
      if (!response.ok) {
        throw new Error('Falha ao carregar comentários');
      }

      const data = await response.json();
      // API returns { comments: [...] } for teacher, or array for student
      const commentsArray = Array.isArray(data) ? data : (data.comments || []);
      const normalizedComments = commentsArray.map(normalizeComment);
      setComments(normalizedComments);
    } catch (err: any) {
      console.error("Error fetching comments: ", err);
      setError(err.message || "Falha ao carregar comentários");
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  // Fetch comments when user changes
  useEffect(() => {
    fetchComments();
    
    // Poll for updates less frequently to save data (every 30 seconds instead of 5)
    const interval = setInterval(() => {
      if (!authLoading && user) {
        fetchComments();
      }
    }, 30000); // 30 seconds instead of 5

    return () => clearInterval(interval);
  }, [fetchComments, authLoading, user]);

  // Function to add a new comment
  const addComment = async (questionId: string, questionTheme: string, questionText: string, message: string) => {
    if (!user) {
      setError("Usuário não autenticado.");
      return { success: false };
    }
    
    try {
      const response = await apiFetch('/comments/add', {
        method: 'POST',
        body: JSON.stringify({
          questionId,
          questionTheme,
          questionText,
          userName: user.nomeCompleto,
          userType: user.userType,
          message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao adicionar comentário');
      }

      // Refresh comments after adding
      await fetchComments();
      return { success: true };
    } catch (err: any) {
      console.error("Error adding comment: ", err);
      setError(err.message || "Falha ao adicionar comentário");
      return { success: false };
    }
  };

  // Function to add a response to a comment
  const addResponse = async (commentId: string, message: string) => {
    if (!user) {
      setError("Usuário não autenticado.");
      return { success: false };
    }
    
    try {
      const response = await apiFetch('/comments-response', {
        method: 'POST',
        body: JSON.stringify({
          commentId,
          userName: user.nomeCompleto,
          userType: user.userType,
          message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao adicionar resposta');
      }

      // Refresh comments after adding response
      await fetchComments();
      return { success: true };
    } catch (err: any) {
      console.error("Error adding response: ", err);
      setError(err.message || "Falha ao adicionar resposta");
      return { success: false };
    }
  };

  return { comments, loading, error, addComment, addResponse, refetch: fetchComments };
};
