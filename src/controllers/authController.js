const authService = require('../services/authService');

exports.register = async (req, res, next) => {
    try {
        const result = await authService.registerUser(req.body);
        res.status(201).json({
            success: true,
            ...result
        });
    } catch (error) {
        next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        const result = await authService.loginUser(req.body);
        res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        next(error);
    }
};

exports.getMe = async (req, res, next) => {
    try {
        const user = await authService.getUserById(req.user.id);
        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        next(error);
    }
};

exports.updateProfile = async (req, res, next) => {
    try {
        const user = await authService.updateUserProfile(req.user.id, req.body);
        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        next(error);
    }
};

exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const result = await authService.changePassword(
            req.user.id, 
            currentPassword, 
            newPassword
        );
        res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        next(error);
    }
};