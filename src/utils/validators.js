const { body, param, query } = require('express-validator');
const User = require('../models/User');
const Team = require('../models/Team');
const Task = require('../models/Task');
const constants = require('./constants');

class Validators {
    // User validation rules
    static userValidationRules() {
        return [
            body('name')
                .trim()
                .notEmpty()
                .withMessage('Name is required')
                .isLength({ min: 2, max: 50 })
                .withMessage('Name must be between 2 and 50 characters')
                .matches(/^[a-zA-Z\s]*$/)
                .withMessage('Name can only contain letters and spaces'),

            body('email')
                .trim()
                .notEmpty()
                .withMessage('Email is required')
                .isEmail()
                .withMessage('Please enter a valid email address')
                .normalizeEmail()
                .custom(async (email) => {
                    const user = await User.findOne({ email });
                    if (user) {
                        throw new Error('Email already in use');
                    }
                    return true;
                }),

            body('password')
                .notEmpty()
                .withMessage('Password is required')
                .isLength({ min: 6 })
                .withMessage('Password must be at least 6 characters')
                .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
                .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'),

            body('confirmPassword')
                .notEmpty()
                .withMessage('Confirm password is required')
                .custom((value, { req }) => {
                    if (value !== req.body.password) {
                        throw new Error('Passwords do not match');
                    }
                    return true;
                })
        ];
    }

    // Login validation rules
    static loginValidationRules() {
        return [
            body('email')
                .trim()
                .notEmpty()
                .withMessage('Email is required')
                .isEmail()
                .withMessage('Please enter a valid email address')
                .normalizeEmail(),

            body('password')
                .notEmpty()
                .withMessage('Password is required')
        ];
    }

    // Team validation rules
    static teamValidationRules() {
        return [
            body('name')
                .trim()
                .notEmpty()
                .withMessage('Team name is required')
                .isLength({ min: 3, max: 100 })
                .withMessage('Team name must be between 3 and 100 characters')
                .matches(/^[a-zA-Z0-9\s\-_]+$/)
                .withMessage('Team name can only contain letters, numbers, spaces, hyphens and underscores')
                .custom(async (name, { req }) => {
                    const team = await Team.findOne({ 
                        name, 
                        creator: req.user.id 
                    });
                    if (team) {
                        throw new Error('You already have a team with this name');
                    }
                    return true;
                }),

            body('description')
                .optional()
                .trim()
                .isLength({ max: 500 })
                .withMessage('Description cannot exceed 500 characters')
        ];
    }

    // Task validation rules
    static taskValidationRules() {
        return [
            body('title')
                .trim()
                .notEmpty()
                .withMessage('Title is required')
                .isLength({ min: 3, max: 200 })
                .withMessage('Title must be between 3 and 200 characters'),

            body('description')
                .optional()
                .trim()
                .isLength({ max: 1000 })
                .withMessage('Description cannot exceed 1000 characters'),

            body('assignedTo')
                .optional()
                .isMongoId()
                .withMessage('Invalid user ID')
                .custom(async (userId, { req }) => {
                    if (!userId) return true;
                    
                    // Check if user exists
                    const user = await User.findById(userId);
                    if (!user) {
                        throw new Error('Assigned user not found');
                    }

                    // Check if user is team member
                    const teamId = req.params.teamId;
                    const team = await Team.findById(teamId);
                    
                    if (!team) {
                        throw new Error('Team not found');
                    }

                    const isMember = team.members.some(member => 
                        member.user.toString() === userId
                    );

                    if (!isMember && team.creator.toString() !== userId) {
                        throw new Error('Cannot assign task to non-team member');
                    }

                    return true;
                }),

            body('status')
                .optional()
                .isIn(['TODO', 'DOING', 'DONE'])
                .withMessage('Status must be TODO, DOING, or DONE')
        ];
    }

    // Comment validation rules
    static commentValidationRules() {
        return [
            body('text')
                .trim()
                .notEmpty()
                .withMessage('Comment text is required')
                .isLength({ min: 1, max: 500 })
                .withMessage('Comment must be between 1 and 500 characters')
        ];
    }

    // Update task validation rules
    static updateTaskValidationRules() {
        return [
            body('title')
                .optional()
                .trim()
                .isLength({ min: 3, max: 200 })
                .withMessage('Title must be between 3 and 200 characters'),

            body('description')
                .optional()
                .trim()
                .isLength({ max: 1000 })
                .withMessage('Description cannot exceed 1000 characters'),

            body('assignedTo')
                .optional()
                .isMongoId()
                .withMessage('Invalid user ID')
                .custom(async (userId, { req }) => {
                    if (!userId) return true;
                    
                    // Get task first to check team
                    const task = await Task.findById(req.params.taskId);
                    if (!task) {
                        throw new Error('Task not found');
                    }

                    // Check if user exists
                    const user = await User.findById(userId);
                    if (!user) {
                        throw new Error('Assigned user not found');
                    }

                    // Check if user is team member
                    const team = await Team.findById(task.team);
                    
                    if (!team) {
                        throw new Error('Team not found');
                    }

                    const isMember = team.members.some(member => 
                        member.user.toString() === userId
                    );

                    if (!isMember && team.creator.toString() !== userId) {
                        throw new Error('Cannot assign task to non-team member');
                    }

                    return true;
                }),

            body('status')
                .optional()
                .isIn(['TODO', 'DOING', 'DONE'])
                .withMessage('Status must be TODO, DOING, or DONE')
        ];
    }

    // Move task validation rules
    static moveTaskValidationRules() {
        return [
            body('status')
                .notEmpty()
                .withMessage('Status is required')
                .isIn(['TODO', 'DOING', 'DONE'])
                .withMessage('Status must be TODO, DOING, or DONE')
        ];
    }

    // Assign task validation rules
    static assignTaskValidationRules() {
        return [
            body('assignedTo')
                .notEmpty()
                .withMessage('User ID is required')
                .isMongoId()
                .withMessage('Invalid user ID')
                .custom(async (userId, { req }) => {
                    // Get task first to check team
                    const task = await Task.findById(req.params.taskId);
                    if (!task) {
                        throw new Error('Task not found');
                    }

                    // Check if user exists
                    const user = await User.findById(userId);
                    if (!user) {
                        throw new Error('User not found');
                    }

                    // Check if user is team member
                    const team = await Team.findById(task.team);
                    
                    if (!team) {
                        throw new Error('Team not found');
                    }

                    const isMember = team.members.some(member => 
                        member.user.toString() === userId
                    );

                    if (!isMember && team.creator.toString() !== userId) {
                        throw new Error('Cannot assign task to non-team member');
                    }

                    return true;
                })
        ];
    }

    // Add member validation rules
    static addMemberValidationRules() {
        return [
            body('userId')
                .notEmpty()
                .withMessage('User ID is required')
                .isMongoId()
                .withMessage('Invalid user ID')
                .custom(async (userId, { req }) => {
                    // Check if user exists
                    const user = await User.findById(userId);
                    if (!user) {
                        throw new Error('User not found');
                    }

                    // Check if user is already team member
                    const team = await Team.findById(req.params.teamId);
                    if (!team) {
                        throw new Error('Team not found');
                    }

                    const isAlreadyMember = team.members.some(member => 
                        member.user.toString() === userId
                    );

                    if (isAlreadyMember) {
                        throw new Error('User is already a team member');
                    }

                    // Cannot add creator as member
                    if (userId === team.creator.toString()) {
                        throw new Error('User is already the team creator');
                    }

                    return true;
                })
        ];
    }

    // Query parameter validation rules
    static queryValidationRules() {
        return [
            query('page')
                .optional()
                .isInt({ min: 1 })
                .withMessage('Page must be a positive integer')
                .toInt(),

            query('limit')
                .optional()
                .isInt({ min: 1, max: 100 })
                .withMessage('Limit must be between 1 and 100')
                .toInt(),

            query('search')
                .optional()
                .trim()
                .isLength({ max: 100 })
                .withMessage('Search query cannot exceed 100 characters'),

            query('assignedTo')
                .optional()
                .isMongoId()
                .withMessage('Invalid assigned user ID'),

            query('status')
                .optional()
                .isIn(['TODO', 'DOING', 'DONE'])
                .withMessage('Invalid status value'),

            query('sort')
                .optional()
                .isIn(['createdAt', '-createdAt', 'updatedAt', '-updatedAt', 'title', '-title'])
                .withMessage('Invalid sort field')
        ];
    }

    // ID parameter validation
    static idValidationRules(paramName = 'id') {
        return [
            param(paramName)
                .notEmpty()
                .withMessage('ID is required')
                .isMongoId()
                .withMessage('Invalid ID format')
        ];
    }

    // Update profile validation rules
    static updateProfileValidationRules() {
        return [
            body('name')
                .optional()
                .trim()
                .isLength({ min: 2, max: 50 })
                .withMessage('Name must be between 2 and 50 characters')
                .matches(/^[a-zA-Z\s]*$/)
                .withMessage('Name can only contain letters and spaces'),

            body('email')
                .optional()
                .trim()
                .isEmail()
                .withMessage('Please enter a valid email address')
                .normalizeEmail()
                .custom(async (email, { req }) => {
                    const user = await User.findOne({ email });
                    if (user && user._id.toString() !== req.user.id) {
                        throw new Error('Email already in use');
                    }
                    return true;
                })
        ];
    }

    // Change password validation rules
    static changePasswordValidationRules() {
        return [
            body('currentPassword')
                .notEmpty()
                .withMessage('Current password is required'),

            body('newPassword')
                .notEmpty()
                .withMessage('New password is required')
                .isLength({ min: 6 })
                .withMessage('New password must be at least 6 characters')
                .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
                .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number and one special character')
                .custom((value, { req }) => {
                    if (value === req.body.currentPassword) {
                        throw new Error('New password must be different from current password');
                    }
                    return true;
                }),

            body('confirmPassword')
                .notEmpty()
                .withMessage('Confirm password is required')
                .custom((value, { req }) => {
                    if (value !== req.body.newPassword) {
                        throw new Error('Passwords do not match');
                    }
                    return true;
                })
        ];
    }

    // File upload validation rules
    static fileUploadValidationRules() {
        return [
            body('file')
                .custom((value, { req }) => {
                    if (!req.file) {
                        throw new Error('File is required');
                    }

                    // Check file size (5MB max)
                    const maxSize = 5 * 1024 * 1024;
                    if (req.file.size > maxSize) {
                        throw new Error('File size cannot exceed 5MB');
                    }

                    // Check file type
                    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
                    if (!allowedTypes.includes(req.file.mimetype)) {
                        throw new Error('Invalid file type. Allowed types: JPEG, PNG, GIF, PDF');
                    }

                    return true;
                })
        ];
    }

    // Email validation
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Password validation
    static validatePassword(password) {
        const minLength = 6;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

        return {
            isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
            errors: {
                length: password.length >= minLength ? null : `Password must be at least ${minLength} characters`,
                upperCase: hasUpperCase ? null : 'Password must contain at least one uppercase letter',
                lowerCase: hasLowerCase ? null : 'Password must contain at least one lowercase letter',
                number: hasNumbers ? null : 'Password must contain at least one number',
                specialChar: hasSpecialChar ? null : 'Password must contain at least one special character'
            }
        };
    }

    // Validate MongoDB ID
    static isValidObjectId(id) {
        return /^[0-9a-fA-F]{24}$/.test(id);
    }

    // Sanitize HTML
    static sanitizeHtml(html) {
        const allowedTags = ['b', 'i', 'u', 'strong', 'em', 'br', 'p', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
        const allowedAttributes = {
            'a': ['href', 'title', 'target'],
            'img': ['src', 'alt', 'title', 'width', 'height']
        };

        // Simple sanitization - in production, use a library like DOMPurify
        let sanitized = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/on\w+="[^"]*"/g, '')
            .replace(/on\w+='[^']*'/g, '')
            .replace(/javascript:/gi, '');

        // Remove disallowed tags (simple approach)
        allowedTags.forEach(tag => {
            const regex = new RegExp(`<\\/?(?!${tag}\\b)[^>]*>`, 'gi');
            sanitized = sanitized.replace(regex, '');
        });

        return sanitized;
    }

    // Validate date range
    static validateDateRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return { isValid: false, error: 'Invalid date format' };
        }
        
        if (start > end) {
            return { isValid: false, error: 'Start date cannot be after end date' };
        }
        
        return { isValid: true, error: null };
    }

    // Validate numeric range
    static validateNumericRange(value, min = 0, max = 100) {
        const num = parseFloat(value);
        
        if (isNaN(num)) {
            return { isValid: false, error: 'Value must be a number' };
        }
        
        if (num < min || num > max) {
            return { isValid: false, error: `Value must be between ${min} and ${max}` };
        }
        
        return { isValid: true, error: null };
    }

    // Validate required fields
    static validateRequiredFields(data, requiredFields) {
        const missingFields = [];
        
        requiredFields.forEach(field => {
            if (data[field] === undefined || data[field] === null || data[field] === '') {
                missingFields.push(field);
            }
        });
        
        return {
            isValid: missingFields.length === 0,
            missingFields,
            error: missingFields.length > 0 ? `Missing required fields: ${missingFields.join(', ')}` : null
        };
    }
}

module.exports = Validators;