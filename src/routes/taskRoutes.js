const express = require('express');
const router = express.Router();
const { 
    createTask, 
    getTasks, 
    updateTask, 
    moveTask, 
    assignTask, 
    addComment, 
    deleteTask 
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router.post('/:teamId/tasks', createTask);
router.get('/:teamId/tasks', getTasks);
router.put('/tasks/:taskId', updateTask);
router.patch('/tasks/:taskId/move', moveTask);
router.patch('/tasks/:taskId/assign', assignTask);
router.post('/tasks/:taskId/comments', addComment);
router.delete('/tasks/:taskId', deleteTask);

module.exports = router;