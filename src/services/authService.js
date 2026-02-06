const User = require('../models/User');
const jwt = require('jsonwebtoken');

class AuthService {
    // Generate JWT Token
    generateToken(userId) {
        return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE
        });
    }

    // Register user
    async registerUser(userData) {
        const { name, email, password } = userData;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new Error('User already exists');
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password
        });

        return {
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            },
            token: this.generateToken(user._id)
        };
    }

    // Login user
    async loginUser(credentials) {
        const { email, password } = credentials;

        // Validate input
        if (!email || !password) {
            throw new Error('Please provide email and password');
        }

        // Check for user
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            throw new Error('Invalid credentials');
        }

        // Check password
        const isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) {
            throw new Error('Invalid credentials');
        }

        return {
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            },
            token: this.generateToken(user._id)
        };
    }

    // Get user by ID
    async getUserById(userId) {
        const user = await User.findById(userId).select('-password');
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }

    // Validate token
    async validateToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await this.getUserById(decoded.id);
            return user;
        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    // Update user profile
    async updateUserProfile(userId, updateData) {
        const allowedUpdates = ['name', 'email'];
        const updates = Object.keys(updateData);
        
        // Check if all updates are allowed
        const isValidOperation = updates.every(update => 
            allowedUpdates.includes(update)
        );

        if (!isValidOperation) {
            throw new Error('Invalid updates');
        }

        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            throw new Error('User not found');
        }

        return user;
    }

    // Change password
    async changePassword(userId, currentPassword, newPassword) {
        const user = await User.findById(userId).select('+password');
        
        if (!user) {
            throw new Error('User not found');
        }

        // Check current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            throw new Error('Current password is incorrect');
        }

        // Update password
        user.password = newPassword;
        await user.save();

        return { message: 'Password updated successfully' };
    }
}

module.exports = new AuthService();