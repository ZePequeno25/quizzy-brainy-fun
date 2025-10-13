const { admin } = require('../utils/firebase');
const logger = require('../utils/logger');

const {isProfessor, isStudent, getUserName} = require('../models/userModel');
const {createTeacherCode, getTeacherCode, useTeacherCode} = require('../models/teacherCodeModel');
const {createTeacherStudent, getTeacherStudents, getStudentRelations, deleteTeacherStudent} = require('../models/teacherStudentModel');

const isValidId = (id, paramName) => {
    if(!id || id === 'undefined' || typeof id !== 'string' || id.trim().length === 0){
        logger.warn(`ID inválido para ${paramName}: ${id}`);
        return false;
    }
    return true;
};

const getCurrentUserId = async (req) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if(!token) throw new Error('Authentication token unavailable');
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken.uid;
};

const generateTeacherCode = async (req, res) => {
    try{
        const userId = await getCurrentUserId(req);
        if(!await isProfessor(userId)){
            return res.status(403).json({error: 'Only professors can generate codes'});
        }
        const { teacherId, linkCode } = req.body;
        if(!teacherId || !linkCode || teacherId !== userId){
            return res.status(400).json({error: 'Invalid teacherId or linkCode'});
        }
        await createTeacherCode(teacherId, linkCode);
        logger.info(`Código gerado: ${linkCode} para professor: ${userId}`);
        res.status(200).json({ linkCode, message: 'Teacher code generated successfully' });
    }catch (error){
        logger.error(`Erro ao gerar código: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

const getTeacherCodeHandler = async (req, res) =>{
    try{
        const { teacherId } = req.params;
        if(!isValidId(teacherId, 'teacherId')){
            return res.status(400).json({ error: 'Invalid teacherId' });
        }
        const codeData = await getTeacherCode(teacherId);
        const code = codeData ? codeData.code : null;
        res.status(200).json({ code });

    }catch (error){
        logger.error(`Erro ao carregar código: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

const linkStudentByCode = async (req, res) =>{
    try{
        const userId = await getCurrentUserId(req);
        if(!await isStudent(userId)){
            return res.status(403).json({ error: 'Only students can link to teachers' });
        }
        const{teacherCode, studentId, studentName} = req.body;
        if(!teacherCode || studentId !== userId || !isValidId(studentId, 'studentId')){
            return res.status(400).json({ error: 'Invalid teacherCode or studentId' });
        }
        
        const { db } = require('../utils/firebase');
        const snapshot = await db.collection('teacher_codes')
            .where('code', '==', teacherCode)
            .get();
        
        if(snapshot.empty){
            return res.status(400).json({ error: 'Invalid or expired code' });
        }
        
        const codeDoc = snapshot.docs[0];
        const codeData = codeDoc.data();
        const teacherId = codeData.teacherId;
        const relationId = `${studentId}_${teacherId}`;
        const existing = await db.collection('teacher_students').doc(relationId).get();
        if(existing.exists){
            return res.status(400).json({ error: 'You are already linked to this teacher' });
        }
        const linkData = await createTeacherStudent(teacherId, studentId, studentName);
        logger.info(`Vinculação via código: aluno ${userId} ao professor ${teacherId}`);
        res.status(200).json({ success: true, teacherName: linkData.teacher_name, relationId});

    }catch (error){
        logger.error(`Erro ao vincular aluno: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

const getTeacherStudentsHandler = async (req, res) =>{
    try{
        const {teacherId} = req.params;
        if(!isValidId(teacherId, 'teacherId')){
            return res.status(400).json({ error: 'Invalid teacherId' });
        }
        const relations = await getTeacherStudents(teacherId);
        res.status(200).json(relations);

    }catch (error){
        logger.error(`Erro ao listar alunos: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

const getStudentRelationsHandler = async (req, res) => {
    try{
        const {studentId} = req.params;
        if(!isValidId(studentId, 'studentId')){
            return res.status(400).json({ error: 'Invalid studentId' });
        }
        const relations = await getStudentRelations(studentId);
        res.status(200).json(relations);

    }catch (error){
        logger.error(`Erro ao listar professores: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

const unlinkStudent = async (req, res) => {
    try{
        const {relationId} = req.params;
        if(!isValidId(relationId, 'relationId')){
            return res.status(400).json({ error: 'Invalid relationId' });
        }
        const userId = await getCurrentUserId(req);
        const { db } = require('../utils/firebase');
        const relationDoc = await db.collection('teacher_students').doc(relationId).get();
        if(!relationDoc.exists){
            return res.status(404).json({ error: 'Relation not found' });
        }
        const relationData = relationDoc.data();
        if(relationData.teacher_id !== userId && relationData.student_id !== userId){
            return res.status(403).json({ error: 'Only participants can unlink' });
        }
        await deleteTeacherStudent(relationId);
        logger.info(`Relação desvinculada: ${relationId} por ${userId}`);
        res.status(200).json({ success: true, message: 'Unlinked successfully' });

    }catch (error){
        logger.error(`Erro ao desvincular: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    generateTeacherCode,
    getTeacherCodeHandler,
    linkStudentByCode,
    getTeacherStudentsHandler,
    getStudentRelationsHandler,
    unlinkStudent
  };
