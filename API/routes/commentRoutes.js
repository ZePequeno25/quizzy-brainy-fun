const express = require('express');
const router = express.Router();
const {
    addCommentHandler,
    getTeacherCommentsHandler,
    getStudentCommentsHandler,
    addCommentResponseHandler
} = require('../controllers/commentController');
const authMiddleware = require('../middlewares/authMiddleware');

// Apply authentication middleware to all routes in this router
router.use(authMiddleware);

router.post('/comments/add', addCommentHandler);
router.get('/teacher-comments/:teacherId', getTeacherCommentsHandler);
router.get('/student-comments/:studentId', getStudentCommentsHandler);
router.post('/comments-response', addCommentResponseHandler);

module.exports = router;