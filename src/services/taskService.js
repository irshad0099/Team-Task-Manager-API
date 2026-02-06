const Task = require('../models/Task');
const Team = require('../models/Team');
const Activity = require('../models/Activity');
const cacheService = require('./cacheService');
const queueService = require('./queueService');

class TaskService {
    // Helper to check if user is team member
    async isTeamMember(teamId, userId) {
        const team = await Team.findById(teamId);
        if (!team) return false;
        
        if (team.creator.toString() === userId) return true;
        
        return team.members.some(member => 
            member.user.toString() === userId
        );
    }

    // Create a new task
    async createTask(taskData, teamId, userId) {
        const { title, description, assignedTo } = taskData;

        // Check if user is team member
        const isMember = await this.isTeamMember(teamId, userId);
        if (!isMember) {
            throw new Error('Only team members can create tasks');
        }

        // Check if assignedTo is team member (if provided)
        if (assignedTo) {
            const isAssigneeMember = await this.isTeamMember(teamId, assignedTo);
            if (!isAssigneeMember) {
                throw new Error('Cannot assign task to non-team member');
            }
        }

        const task = await Task.create({
            title,
            description,
            team: teamId,
            assignedTo,
            createdBy: userId,
            status: 'TODO'
        });

        // Populate task
        const populatedTask = await task.populate([
            { path: 'assignedTo', select: 'name email' },
            { path: 'createdBy', select: 'name email' }
        ]);

        // Log activity
        const activity = await Activity.create({
            action: 'CREATED',
            entityType: 'TASK',
            entityId: task._id,
            performedBy: userId,
            details: { 
                title: task.title,
                status: task.status,
                assignedTo: task.assignedTo
            }
        });

        // Add to queue for processing
        await queueService.addActivity({ activityId: activity._id });

        // Invalidate cache
        await cacheService.invalidateTeamTasks(teamId);

        return populatedTask;
    }

    // Get tasks with pagination, search, and filtering
    async getTasks(teamId, userId, queryParams) {
        const { 
            page = 1, 
            limit = 10, 
            search, 
            assignedTo, 
            status,
            sort = '-createdAt' 
        } = queryParams;

        // Check if user is team member
        const isMember = await this.isTeamMember(teamId, userId);
        if (!isMember) {
            throw new Error('Only team members can view tasks');
        }

        // Build query
        let query = { team: teamId };

        // Search by title or description
        if (search) {
            query.$text = { $search: search };
        }

        // Filter by assigned user
        if (assignedTo) {
            query.assignedTo = assignedTo;
        }

        // Filter by status
        if (status) {
            if (!['TODO', 'DOING', 'DONE'].includes(status)) {
                throw new Error('Invalid status value');
            }
            query.status = status;
        }

        // Check cache first
        const cacheKey = {
            teamId,
            page: parseInt(page),
            limit: parseInt(limit),
            search,
            assignedTo,
            status,
            sort
        };

        const cachedData = await cacheService.getTasks(
            teamId, 
            page, 
            limit, 
            cacheKey
        );

        if (cachedData) {
            return { ...cachedData, fromCache: true };
        }

        // Execute query
        const tasks = await Task.find(query)
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email')
            .populate('comments.createdBy', 'name email')
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Task.countDocuments(query);

        const result = {
            tasks,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        };

        // Cache the result
        await cacheService.setTasks(
            teamId, 
            page, 
            limit, 
            cacheKey, 
            result
        );

        return { ...result, fromCache: false };
    }

    // Get task by ID
    async getTaskById(taskId, userId) {
        const task = await Task.findById(taskId)
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email')
            .populate('comments.createdBy', 'name email');

        if (!task) {
            throw new Error('Task not found');
        }

        // Check if user is team member
        const isMember = await this.isTeamMember(task.team.toString(), userId);
        if (!isMember) {
            throw new Error('Not authorized to view this task');
        }

        return task;
    }

    // Update task
    async updateTask(taskId, userId, updateData) {
        let task = await Task.findById(taskId);

        if (!task) {
            throw new Error('Task not found');
        }

        // Check if user is team member
        const isMember = await this.isTeamMember(task.team.toString(), userId);
        if (!isMember) {
            throw new Error('Not authorized to update this task');
        }

        // Allowed updates
        const allowedUpdates = ['title', 'description', 'assignedTo'];
        const updates = Object.keys(updateData);
        
        const isValidOperation = updates.every(update => 
            allowedUpdates.includes(update)
        );

        if (!isValidOperation) {
            throw new Error('Invalid updates');
        }

        // Check if assignedTo is team member (if being updated)
        if (updateData.assignedTo) {
            const isAssigneeMember = await this.isTeamMember(
                task.team.toString(), 
                updateData.assignedTo
            );
            if (!isAssigneeMember) {
                throw new Error('Cannot assign task to non-team member');
            }
        }

        // Update task
        task = await Task.findByIdAndUpdate(
            taskId,
            updateData,
            { new: true, runValidators: true }
        ).populate('assignedTo', 'name email');

        // Log activity
        const activity = await Activity.create({
            action: 'UPDATED',
            entityType: 'TASK',
            entityId: task._id,
            performedBy: userId,
            details: updateData
        });

        // Add to queue for processing
        await queueService.addActivity({ activityId: activity._id });

        // Invalidate cache
        await cacheService.invalidateTeamTasks(task.team.toString());

        return task;
    }

    // Move task between columns
    async moveTask(taskId, userId, newStatus) {
        if (!['TODO', 'DOING', 'DONE'].includes(newStatus)) {
            throw new Error('Invalid status');
        }

        let task = await Task.findById(taskId);

        if (!task) {
            throw new Error('Task not found');
        }

        // Check if user is team member
        const isMember = await this.isTeamMember(task.team.toString(), userId);
        if (!isMember) {
            throw new Error('Not authorized to move this task');
        }

        const oldStatus = task.status;
        
        // Update status
        task.status = newStatus;
        await task.save();

        // Populate task
        task = await task.populate('assignedTo', 'name email');

        // Log activity
        const activity = await Activity.create({
            action: 'MOVED',
            entityType: 'TASK',
            entityId: task._id,
            performedBy: userId,
            details: { 
                from: oldStatus, 
                to: newStatus 
            }
        });

        // Add to queue for processing
        await queueService.addActivity({ activityId: activity._id });

        // Invalidate cache
        await cacheService.invalidateTeamTasks(task.team.toString());

        return task;
    }

    // Assign task to user
    async assignTask(taskId, userId, assigneeId) {
        let task = await Task.findById(taskId);

        if (!task) {
            throw new Error('Task not found');
        }

        // Check if user is team member
        const isMember = await this.isTeamMember(task.team.toString(), userId);
        if (!isMember) {
            throw new Error('Not authorized to assign this task');
        }

        // Check if assignee is team member
        const isAssigneeMember = await this.isTeamMember(
            task.team.toString(), 
            assigneeId
        );
        if (!isAssigneeMember) {
            throw new Error('Cannot assign task to non-team member');
        }

        const oldAssignee = task.assignedTo;
        
        // Update assignee
        task.assignedTo = assigneeId;
        await task.save();

        // Populate task
        task = await task.populate('assignedTo', 'name email');

        // Log activity
        const activity = await Activity.create({
            action: 'ASSIGNED',
            entityType: 'TASK',
            entityId: task._id,
            performedBy: userId,
            details: { 
                from: oldAssignee, 
                to: assigneeId 
            }
        });

        // Add to queue for processing
        await queueService.addActivity({ activityId: activity._id });

        // Invalidate cache
        await cacheService.invalidateTeamTasks(task.team.toString());

        return task;
    }

    // Add comment to task
    async addComment(taskId, userId, commentText) {
        let task = await Task.findById(taskId);

        if (!task) {
            throw new Error('Task not found');
        }

        // Check if user is team member
        const isMember = await this.isTeamMember(task.team.toString(), userId);
        if (!isMember) {
            throw new Error('Not authorized to comment on this task');
        }

        // Add comment
        task.comments.push({
            text: commentText,
            createdBy: userId
        });

        await task.save();

        // Populate comments
        task = await task.populate('comments.createdBy', 'name email');

        // Log activity
        const activity = await Activity.create({
            action: 'COMMENTED',
            entityType: 'TASK',
            entityId: task._id,
            performedBy: userId,
            details: { 
                commentLength: commentText.length 
            }
        });

        await queueService.addActivity({ activityId: activity._id });

        return task.comments;
    }

    // Delete task
    async deleteTask(taskId, userId) {
        const task = await Task.findById(taskId);

        if (!task) {
            throw new Error('Task not found');
        }

        // Get team to check permissions
        const team = await Team.findById(task.team);
        if (!team) {
            throw new Error('Team not found');
        }

        // Check permissions
        const isCreator = task.createdBy.toString() === userId;
        const isTeamAdmin = team.creator.toString() === userId;

        if (!isCreator && !isTeamAdmin) {
            throw new Error('Not authorized to delete this task');
        }

        // Log activity before deletion
        const activity = await Activity.create({
            action: 'DELETED',
            entityType: 'TASK',
            entityId: task._id,
            performedBy: userId,
            details: { title: task.title }
        });

        await queueService.addActivity({ activityId: activity._id });

        // Delete task
        await task.deleteOne();

        // Invalidate cache
        await cacheService.invalidateTeamTasks(task.team.toString());

        return { message: 'Task deleted successfully' };
    }

    // Get task statistics for a team
    async getTaskStatistics(teamId, userId) {
        // Check if user is team member
        const isMember = await this.isTeamMember(teamId, userId);
        if (!isMember) {
            throw new Error('Only team members can view statistics');
        }

        const statistics = await Task.aggregate([
            { $match: { team: mongoose.Types.ObjectId(teamId) } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    averageComments: { $avg: { $size: '$comments' } }
                }
            }
        ]);

        const totalTasks = await Task.countDocuments({ team: teamId });
        const tasksByUser = await Task.aggregate([
            { $match: { team: mongoose.Types.ObjectId(teamId) } },
            {
                $group: {
                    _id: '$assignedTo',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        return {
            statistics,
            totalTasks,
            tasksByUser
        };
    }
}

module.exports = new TaskService();