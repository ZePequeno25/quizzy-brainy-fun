import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

interface Student {
  id: string;
  nomeCompleto: string;
  email: string;
  score: number;
  cpf: string;
}

interface Question {
  questionId: string;
  question: string;
  correctAnswer: string;
  userAnswer: string;
  isCorrect: boolean;
}

interface StudentData extends Student {
  questions: Question[];
}

export const useTeacherStudent = (teacherId: string | undefined) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingStudentData, setLoadingStudentData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    if (!teacherId) return;
    setLoadingStudents(true);
    try {
      const response = await apiFetch(`/students_data`);
      if (!response.ok) throw new Error('Falha ao carregar alunos');
      const data = await response.json();
      setStudents(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingStudents(false);
    }
  }, [teacherId]);

  const fetchStudentData = async (studentId: string) => {
    if (!teacherId) return;
    setLoadingStudentData(true);
    try {
      const response = await apiFetch(`/student_answers/${studentId}`);
      if (!response.ok) throw new Error('Falha ao carregar dados do aluno');
      const data = await response.json();
      setSelectedStudent(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingStudentData(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents, teacherId]);

  return {
    students,
    selectedStudent,
    loadingStudents,
    loadingStudentData,
    error,
    fetchStudentData,
    fetchStudents,
  };
};