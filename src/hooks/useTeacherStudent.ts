import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

interface TeacherStudentRelation {
  teacherId: string;
  studentId: string;
  teacherName: string;
  studentName: string;
  createdAt: string;
}

interface TeacherProfile {
  uid: string;
  nomeCompleto: string;
  linkCode: string;
}

export const useTeacherStudent = () => {
  const { user, getAuthToken } = useAuth();
  const userId = user?.uid || 'guest';
  
  const [relations, setRelations] = useState<TeacherStudentRelation[]>(() => {
    const saved = localStorage.getItem(`relations_${userId}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [teacherCode, setTeacherCode] = useState<string>(() => localStorage.getItem(`teacherCode_${userId}`) || "");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    if (user) {
      localStorage.setItem(`relations_${userId}`, JSON.stringify(relations));
      localStorage.setItem(`teacherCode_${userId}`, teacherCode);
    }
  }, [relations, teacherCode, userId, user]);

  // Gerar código único do professor
  const generateTeacherCode = async () => {
    if (!user || user.userType !== 'professor') return;
    
    const code = `PROF_${user.uid.substring(0, 8).toUpperCase()}`;
    setTeacherCode(code);
    
    // Salvar código no backend
    try {
      const token = getAuthToken();
      await apiFetch('/api/teacher-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          teacherId: user.uid, 
          teacherName: user.nomeCompleto,
          linkCode: code 
        })
      });
    } catch (error) {
      console.error('Erro ao salvar código do professor:', error);
    }
  };

  // Carregar código do professor
  const loadTeacherCode = async () => {
    if (!user || user.userType !== 'professor') return;
    
    try {
      const response = await apiFetch(`/api/teacher-code/${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        if (data.code) {
          setTeacherCode(data.code);
          localStorage.setItem(`teacherCode_${userId}`, data.code);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar código:', error);
      setTeacherCode(`PROF_${user.uid.substring(0, 8).toUpperCase()}`);
    }
  };

  // Vincular aluno ao professor via código
  const linkStudentToTeacher = async (code: string) => {
    if (!user || user.userType !== 'aluno') return { success: false };
    
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await apiFetch('/api/link-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: user.uid,
          studentName: user.nomeCompleto,
          teacherCode: code
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Vinculação realizada!",
          description: `Você foi vinculado ao professor ${data.teacherName}`,
        });
        loadStudentRelations();
        return { success: true };
      } else {
        throw new Error(data.error || 'Código inválido');
      }
    } catch (error: any) {
      toast({
        title: "Erro na vinculação",
        description: error.message || "Código inválido ou professor não encontrado",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // Carregar relacionamentos do aluno
  const loadStudentRelations = async () => {
    if (!user || user.userType !== 'aluno') return;
    
    try {
      const response = await apiFetch(`/api/student-relations/${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        setRelations(data);
        localStorage.setItem(`relations_${userId}`, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Erro ao carregar relacionamentos:', error);
    }
  };

  // Carregar alunos do professor
  const loadTeacherStudents = async () => {
    if (!user || user.userType !== 'professor') return;
    
    try {
      const response = await apiFetch(`/api/teacher-students/${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        setRelations(data);
        localStorage.setItem(`relations_${userId}`, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
    }
  };

  // Desvincular aluno
  const unlinkStudent = async (relationId: string) => {
    try {
      const token = getAuthToken();
      const response = await apiFetch(`/api/unlink-student/${relationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast({
          title: "Desvinculação realizada",
          description: "Aluno desvinculado com sucesso"
        });
        
        if (user?.userType === 'professor') {
          loadTeacherStudents();
        } else {
          loadStudentRelations();
        }
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao desvincular aluno",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (user) {
      if (user.userType === 'professor') {
        loadTeacherCode();
        loadTeacherStudents();
      } else {
        loadStudentRelations();
      }
    }
  }, [user]);

  return {
    relations,
    teacherCode,
    loading,
    generateTeacherCode,
    linkStudentToTeacher,
    unlinkStudent,
    loadStudentRelations,
    loadTeacherStudents
  };
};