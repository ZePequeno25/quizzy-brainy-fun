import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

interface Comment {
  commentId: string;
  userId: string;
  userNome: string;
  userType: string;
  comment: string;
  createdAt: string;
}

export const useComments = (questionId: string) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    console.log(`📡 [useComments] Carregando comentários de ${questionId}`);
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch(`/comments/${questionId}`);
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} - /comments/${questionId}`);
      }
      const data = await response.json();
      setComments(data);
    } catch (err: any) {
      console.error(`❌ [useComments] ${err.message}`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [questionId]);

  useEffect(() => {
    if (questionId) {
      fetchComments();
    }
  }, [fetchComments, questionId]);

  const postComment = async (comment: string, user: { uid: string; nomeCompleto: string; userType: string; }) => {
    try {
      const response = await apiFetch(`/comments/${questionId}`,
        {
          method: 'POST',
          body: JSON.stringify({
            comment,
            userId: user.uid,
            userNome: user.nomeCompleto,
            userType: user.userType,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Falha ao postar comentário');
      }

      await fetchComments(); // Re-fetch comments to show the new one
    } catch (err: any) {
      console.error('❌ [useComments] Erro ao postar comentário:', err.message);
      setError(err.message);
    }
  };

  return { comments, loading, error, postComment, refetchComments: fetchComments };
};