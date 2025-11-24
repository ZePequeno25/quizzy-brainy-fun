
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from './use-toast';
import { useAuth } from './useAuth';

// Relação entre professor e aluno
interface Relation {
  teacherId: string;
  teacherName: string;
  studentId: string;
  studentName: string;
  createdAt: string;
  relationId?: string;
}

export const useTeacherStudent = (userId: string | undefined) => {
  const { user } = useAuth();
  const [relations, setRelations] = useState<Relation[]>([]);
  const [teacherCode, setTeacherCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Buscar código do professor
  const fetchTeacherCode = useCallback(async () => {
    if (!userId || !user || user.userType !== 'professor') {
      return;
    }

    try {
      const response = await apiFetch(`/teacher-code/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setTeacherCode(data.linkCode || '');
      }
    } catch (err: any) {
      console.error('Erro ao buscar código do professor:', err);
    }
  }, [userId, user]);

  const fetchRelations = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Use the correct endpoint based on user type
      // For students: /teacher-relations/:studentId
      // For teachers: /teacher-students/:teacherId
      let response;
      if (user?.userType === 'professor') {
        response = await apiFetch(`/teacher-students/${userId}`);
      } else {
        response = await apiFetch(`/teacher-relations/${userId}`);
      }
      
      if (!response.ok) {
        throw new Error('Falha ao carregar as relações');
      }
      const data = await response.json();
      
      // Normalizar dados para o formato esperado
      const normalizedRelations = Array.isArray(data) ? data.map((rel: any) => ({
        teacherId: rel.teacher_id || rel.teacherId,
        teacherName: rel.teacher_name || rel.teacherName,
        studentId: rel.student_id || rel.studentId,
        studentName: rel.student_name || rel.studentName,
        createdAt: rel.createdAt || rel.created_at || rel.joined_at,
        relationId: rel.relationId || rel.relation_id
      })) : [];
      
      setRelations(normalizedRelations);
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
  }, [userId, user, toast]);

  // Gerar novo código de professor
  const generateTeacherCode = useCallback(async () => {
    if (!userId || !user || user.userType !== 'professor') {
      toast({
        title: 'Erro',
        description: 'Apenas professores podem gerar códigos',
        variant: 'destructive',
      });
      return { success: false };
    }

    try {
      const response = await apiFetch('/teacher-code', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao gerar código');
      }

      const data = await response.json();
      setTeacherCode(data.linkCode || '');
      
      toast({
        title: 'Código gerado!',
        description: 'Novo código de vinculação gerado com sucesso',
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
  }, [userId, user, toast]);

  // Vincular aluno ao professor
  const linkStudentToTeacher = useCallback(async (code: string) => {
    if (!userId || !user || user.userType !== 'aluno') {
      toast({
        title: 'Erro',
        description: 'Apenas alunos podem vincular-se a professores',
        variant: 'destructive',
      });
      return { success: false };
    }

    try {
      const response = await apiFetch('/link-student', {
        method: 'POST',
        body: JSON.stringify({
          teacherCode: code,
          studentId: userId,
          studentName: user.nomeCompleto
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao vincular ao professor');
      }

      toast({
        title: 'Vinculação realizada!',
        description: 'Você foi vinculado ao professor com sucesso',
      });
      
      // Recarregar relações
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
  }, [userId, user, toast, fetchRelations]);

  // Desvincular aluno/professor
  const unlinkStudent = useCallback(async (relationIdOrId: string) => {
    if (!userId) {
      return { success: false };
    }

    try {
      // Se for um relationId completo, usar diretamente, senão buscar
      let relationId = relationIdOrId;
      
      // Se não parece ser um relationId completo, tentar encontrar
      if (!relationId.includes('_')) {
        const relation = relations.find(r => 
          (user?.userType === 'professor' && r.studentId === relationId) ||
          (user?.userType === 'aluno' && r.teacherId === relationId)
        );
        relationId = relation?.relationId || relationId;
      }

      const response = await apiFetch(`/unlink-student/${relationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao desvincular');
      }

      toast({
        title: 'Desvinculação realizada!',
        description: 'Vinculação removida com sucesso',
      });
      
      // Recarregar relações
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
  }, [userId, user, relations, toast, fetchRelations]);

  useEffect(() => {
    fetchRelations();
    if (user?.userType === 'professor') {
      fetchTeacherCode();
    }
  }, [fetchRelations, fetchTeacherCode, user]);

  return { 
    relations, 
    teacherCode,
    loading, 
    error, 
    refetch: fetchRelations,
    generateTeacherCode,
    linkStudentToTeacher,
    unlinkStudent
  };
};
