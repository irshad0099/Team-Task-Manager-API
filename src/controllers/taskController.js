const taskService = require('../services/taskService');

exports.createTask = async (req, res, next) => {
    try {
        const task = await taskService.createTask(
            req.body, 
            req.params.teamId, 
            req.user.id
        );
        res.status(201).json({
            success: true,
            data: task
        });
    } catch (error) {
        next(error);
    }
};

exports.getTasks = async (req, res, next) => {
    try {
        const result = await taskService.getTasks(
            req.params.teamId, 
            req.user.id, 
            req.query
        );
        res.status(200).json({
            success: true,
            fromCache: result.fromCache,
            ...result
        });
    } catch (error) {
        next(error);
    }
};

exports.getTask = async (req, res, next) => {
    try {
        const task = await taskService.getTaskById(
            req.params.taskId, 
            req.user.id
        );
        res.status(200).json({
            success: true,
            data: task
        });
    } catch (error) {
        next(error);
    }
};

exports.updateTask = async (req, res, next) => {
    try {
        const task = await taskService.updateTask(
            req.params.taskId, 
            req.user.id, 
            req.body
        );
        res.status(200).json({
            success: true,
            data: task
        });
    } catch (error) {
        next(error);
    }
};

exports.moveTask = async (req, res, next) => {
    try {
        const { status } = req.body;
        const task = await taskService.moveTask(
            req.params.taskId, 
            req.user.id, 
            status
        );
        res.status(200).json({
            success: true,
            data: task
        });
    } catch (error) {
        next(error);
    }
};

exports.assignTask = async (req, res, next) => {
    try {
        const { assignedTo } = req.body;
        const task = await taskService.assignTask(
            req.params.taskId, 
            req.user.id, 
            assignedTo
        );
        res.status(200).json({
            success: true,
            data: task
        });
    } catch (error) {
        next(error);
    }
};

exports.addComment = async (req, res, next) => {
    try {
        const { text } = req.body;
        const comments = await taskService.addComment(
            req.params.taskId, 
            req.user.id, 
            text
        );
        res.status(200).json({
            success: true,
            data: comments
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteTask = async (req, res, next) => {
    try {
        const result = await taskService.deleteTask(
            req.params.taskId, 
            req.user.id
        );
        res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        next(error);
    }
};

exports.getTaskStatistics = async (req, res, next) => {
    try {
        const statistics = await taskService.getTaskStatistics(
            req.params.teamId, 
            req.user.id
        );
        res.status(200).json({
            success: true,
            data: statistics
        });
    } catch (error) {
        next(error);
    }
};