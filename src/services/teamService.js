const Team = require('../models/Team');
const User = require('../models/User');
const Activity = require('../models/Activity');
const queueService = require('./queueService');

class TeamService {
    // Create a new team
    async createTeam(teamData, creatorId) {
        const { name, description } = teamData;

        // Check if team name already exists for this user
        const existingTeam = await Team.findOne({ 
            name, 
            creator: creatorId 
        });
        
        if (existingTeam) {
            throw new Error('You already have a team with this name');
        }

        const team = await Team.create({
            name,
            description,
            creator: creatorId,
            members: [{
                user: creatorId,
                role: 'admin'
            }]
        });

        // Log activity
        const activity = await Activity.create({
            action: 'CREATED',
            entityType: 'TEAM',
            entityId: team._id,
            performedBy: creatorId,
            details: { teamName: team.name }
        });

        // Add to queue for processing
        await queueService.addActivity({ activityId: activity._id });

        return team;
    }

    // Get team by ID with populated data
    async getTeamById(teamId, userId) {
        const team = await Team.findById(teamId)
            .populate('creator', 'name email')
            .populate('members.user', 'name email');

        if (!team) {
            throw new Error('Team not found');
        }

        // Check if user has access to team
        const hasAccess = await this.checkTeamAccess(teamId, userId);
        if (!hasAccess) {
            throw new Error('Not authorized to access this team');
        }

        return team;
    }

    // Check if user has access to team
    async checkTeamAccess(teamId, userId) {
        const team = await Team.findById(teamId);
        
        if (!team) return false;
        
        // User is creator
        if (team.creator.toString() === userId) return true;
        
        // User is member
        return team.members.some(member => 
            member.user.toString() === userId
        );
    }

    // Add member to team
    async addTeamMember(teamId, userId, newMemberId) {
        const team = await Team.findById(teamId);

        if (!team) {
            throw new Error('Team not found');
        }

        // Verify requester is team creator
        if (team.creator.toString() !== userId) {
            throw new Error('Only team creator can add members');
        }

        // Check if new member exists
        const newMember = await User.findById(newMemberId);
        if (!newMember) {
            throw new Error('User not found');
        }

        // Check if user is already a member
        const isAlreadyMember = team.members.some(member => 
            member.user.toString() === newMemberId
        );

        if (isAlreadyMember) {
            throw new Error('User is already a team member');
        }

        // Add member
        team.members.push({
            user: newMemberId,
            role: 'member'
        });

        await team.save();

        // Log activity
        const activity = await Activity.create({
            action: 'UPDATED',
            entityType: 'TEAM',
            entityId: team._id,
            performedBy: userId,
            details: { 
                action: 'ADD_MEMBER',
                memberId: newMemberId,
                memberName: newMember.name
            }
        });

        await queueService.addActivity({ activityId: activity._id });

        return team;
    }

    // Remove member from team
    async removeTeamMember(teamId, userId, memberIdToRemove) {
        const team = await Team.findById(teamId);

        if (!team) {
            throw new Error('Team not found');
        }

        // Verify requester is team creator
        if (team.creator.toString() !== userId) {
            throw new Error('Only team creator can remove members');
        }

        // Cannot remove creator
        if (memberIdToRemove === team.creator.toString()) {
            throw new Error('Cannot remove team creator');
        }

        // Check if member exists in team
        const memberExists = team.members.some(member => 
            member.user.toString() === memberIdToRemove
        );

        if (!memberExists) {
            throw new Error('Member not found in team');
        }

        // Remove member
        team.members = team.members.filter(member => 
            member.user.toString() !== memberIdToRemove
        );

        await team.save();

        // Log activity
        const memberToRemove = await User.findById(memberIdToRemove);
        const activity = await Activity.create({
            action: 'UPDATED',
            entityType: 'TEAM',
            entityId: team._id,
            performedBy: userId,
            details: { 
                action: 'REMOVE_MEMBER',
                memberId: memberIdToRemove,
                memberName: memberToRemove.name
            }
        });

        await queueService.addActivity({ activityId: activity._id });

        return team;
    }

    // Get all teams for a user
    async getUserTeams(userId) {
        const teams = await Team.find({
            $or: [
                { creator: userId },
                { 'members.user': userId }
            ]
        })
        .populate('creator', 'name email')
        .populate('members.user', 'name email')
        .sort('-createdAt');

        return teams;
    }

    // Get team members
    async getTeamMembers(teamId, userId) {
        const team = await Team.findById(teamId)
            .populate('members.user', 'name email createdAt');

        if (!team) {
            throw new Error('Team not found');
        }

        // Check if user has access
        const hasAccess = await this.checkTeamAccess(teamId, userId);
        if (!hasAccess) {
            throw new Error('Not authorized to view team members');
        }

        return team.members;
    }

    // Update team information
    async updateTeam(teamId, userId, updateData) {
        const team = await Team.findById(teamId);

        if (!team) {
            throw new Error('Team not found');
        }

        // Verify requester is team creator
        if (team.creator.toString() !== userId) {
            throw new Error('Only team creator can update team');
        }

        // Allowed updates
        const allowedUpdates = ['name', 'description'];
        const updates = Object.keys(updateData);
        
        const isValidOperation = updates.every(update => 
            allowedUpdates.includes(update)
        );

        if (!isValidOperation) {
            throw new Error('Invalid updates');
        }

        // Update team
        updates.forEach(update => team[update] = updateData[update]);
        await team.save();

        // Log activity
        const activity = await Activity.create({
            action: 'UPDATED',
            entityType: 'TEAM',
            entityId: team._id,
            performedBy: userId,
            details: updateData
        });

        await queueService.addActivity({ activityId: activity._id });

        return team;
    }

    // Delete team
    async deleteTeam(teamId, userId) {
        const team = await Team.findById(teamId);

        if (!team) {
            throw new Error('Team not found');
        }

        // Verify requester is team creator
        if (team.creator.toString() !== userId) {
            throw new Error('Only team creator can delete team');
        }

        // Log activity before deletion
        const activity = await Activity.create({
            action: 'DELETED',
            entityType: 'TEAM',
            entityId: team._id,
            performedBy: userId,
            details: { teamName: team.name }
        });

        await queueService.addActivity({ activityId: activity._id });

        // Delete team
        await team.deleteOne();

        return { message: 'Team deleted successfully' };
    }

    // Search teams
    async searchTeams(query, userId) {
        const { search, page = 1, limit = 10 } = query;
        
        const searchQuery = {
            $or: [
                { creator: userId },
                { 'members.user': userId }
            ]
        };

        if (search) {
            searchQuery.$text = { $search: search };
        }

        const teams = await Team.find(searchQuery)
            .populate('creator', 'name email')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort('-createdAt');

        const total = await Team.countDocuments(searchQuery);

        return {
            teams,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
}

module.exports = new TeamService();