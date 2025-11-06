
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

export const useTeacherStudent = (userId?: string) => {
  const [relations, setRelations] = useState<Relation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teacherCode, setTeacherCode] = useState<string>('');
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

  const linkStudentToTeacher = async (code: string) => {
    try {
      const response = await apiFetch('/relations/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherCode: code }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao vincular');
      }

      toast({
        title: 'Vinculação realizada!',
        description: 'Você foi vinculado ao professor com sucesso',
      });
      
      await fetchRelations();
      return { success: true };
    } catch (err: any) {
      toast({
        title: 'Erro ao vincular',
        description: err.message,
        variant: 'destructive',
      });
      return { success: false, error: err.message };
    }
  };

  const unlinkStudent = async (studentId: string) => {
    try {
      const response = await apiFetch(`/relations/unlink/${studentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Falha ao desvincular');
      }

      toast({
        title: 'Desvinculação realizada!',
        description: 'Aluno desvinculado com sucesso',
      });
      
      await fetchRelations();
      return { success: true };
    } catch (err: any) {
      toast({
        title: 'Erro ao desvincular',
        description: err.message,
        variant: 'destructive',
      });
      return { success: false, error: err.message };
    }
  };

  const generateTeacherCode = async () => {
    try {
      const response = await apiFetch('/relations/generate-code', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Falha ao gerar código');
      }

      const data = await response.json();
      setTeacherCode(data.code);
      
      toast({
        title: 'Código gerado!',
        description: 'Compartilhe com seus alunos',
      });
      
      return { success: true };
    } catch (err: any) {
      toast({
        title: 'Erro ao gerar código',
        description: err.message,
        variant: 'destructive',
      });
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchRelations();
  }, [fetchRelations]);

  return { 
    relations, 
    loading, 
    error, 
    teacherCode,
    refetch: fetchRelations,
    linkStudentToTeacher,
    unlinkStudent,
    generateTeacherCode
  };
};
