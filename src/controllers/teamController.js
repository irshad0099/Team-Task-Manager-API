const teamService = require('../services/teamService');

exports.createTeam = async (req, res, next) => {
    try {
        const team = await teamService.createTeam(req.body, req.user.id);
        res.status(201).json({
            success: true,
            data: team
        });
    } catch (error) {
        next(error);
    }
};

exports.addMember = async (req, res, next) => {
    try {
        const { userId } = req.body;
        const team = await teamService.addTeamMember(
            req.params.teamId, 
            req.user.id, 
            userId
        );
        res.status(200).json({
            success: true,
            data: team
        });
    } catch (error) {
        next(error);
    }
};

exports.removeMember = async (req, res, next) => {
    try {
        const team = await teamService.removeTeamMember(
            req.params.teamId, 
            req.user.id, 
            req.params.userId
        );
        res.status(200).json({
            success: true,
            data: team
        });
    } catch (error) {
        next(error);
    }
};

exports.getMembers = async (req, res, next) => {
    try {
        const members = await teamService.getTeamMembers(
            req.params.teamId, 
            req.user.id
        );
        res.status(200).json({
            success: true,
            data: members
        });
    } catch (error) {
        next(error);
    }
};

exports.getMyTeams = async (req, res, next) => {
    try {
        const teams = await teamService.getUserTeams(req.user.id);
        res.status(200).json({
            success: true,
            count: teams.length,
            data: teams
        });
    } catch (error) {
        next(error);
    }
};

exports.getTeam = async (req, res, next) => {
    try {
        const team = await teamService.getTeamById(
            req.params.teamId, 
            req.user.id
        );
        res.status(200).json({
            success: true,
            data: team
        });
    } catch (error) {
        next(error);
    }
};

exports.updateTeam = async (req, res, next) => {
    try {
        const team = await teamService.updateTeam(
            req.params.teamId, 
            req.user.id, 
            req.body
        );
        res.status(200).json({
            success: true,
            data: team
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteTeam = async (req, res, next) => {
    try {
        const result = await teamService.deleteTeam(
            req.params.teamId, 
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

exports.searchTeams = async (req, res, next) => {
    try {
        const result = await teamService.searchTeams(req.query, req.user.id);
        res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        next(error);
    }
};