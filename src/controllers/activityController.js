const Activity = require('../models/Activity');

// @desc    Get activity logs for a team
// @route   GET /api/teams/:teamId/activities
// @access  Private (Team members only)
exports.getActivities = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const activities = await Activity.find({
            $or: [
                { entityType: 'TEAM', entityId: req.params.teamId },
                { 
                    entityType: 'TASK', 
                    entityId: { $in: await getTeamTaskIds(req.params.teamId) }
                }
            ]
        })
        .populate('performedBy', 'name email')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

        const total = await Activity.countDocuments({
            $or: [
                { entityType: 'TEAM', entityId: req.params.teamId },
                { 
                    entityType: 'TASK', 
                    entityId: { $in: await getTeamTaskIds(req.params.teamId) }
                }
            ]
        });

        res.status(200).json({
            success: true,
            data: {
                activities,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit),
                total
            }
        });
    } catch (error) {
        next(error);
    }
};

// Helper function to get all task IDs for a team
async function getTeamTaskIds(teamId) {
    const Task = require('../models/Task');
    const tasks = await Task.find({ team: teamId }).select('_id');
    return tasks.map(task => task._id);
}