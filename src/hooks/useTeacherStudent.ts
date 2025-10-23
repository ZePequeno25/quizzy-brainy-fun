
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from './use-toast';

// Relação entre professor e aluno
interface Relation {
  teacherId: string;
  teacherName: string;
  studentId: string;
  studentName: string;
  createdAt: string;
}

export const useTeacherStudent = (userId: string | undefined) => {
  const [relations, setRelations] = useState<Relation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRelations = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch(`/relations/${userId}`);
      if (!response.ok) {
        throw new Error('Falha ao carregar as relações');
      }
      const data = await response.json();
      setRelations(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Erro ao buscar relações',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    fetchRelations();
  }, [fetchRelations]);

  return { relations, loading, error, refetch: fetchRelations };
};
