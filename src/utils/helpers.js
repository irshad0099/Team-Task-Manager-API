const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;

class Helpers {
    // Generate random string
    static generateRandomString(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    // Generate unique ID
    static generateId(prefix = '') {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `${prefix}${timestamp}${random}`.toUpperCase();
    }

    // Hash password
    static async hashPassword(password) {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    }

    // Compare password
    static async comparePassword(password, hashedPassword) {
        return bcrypt.compare(password, hashedPassword);
    }

    // Generate JWT token
    static generateToken(payload, expiresIn = '7d') {
        return jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: expiresIn
        });
    }

    // Verify JWT token
    static verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return null;
        }
    }

    // Format date
    static formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');

        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    }

    // Calculate time difference
    static timeDifference(fromDate, toDate = new Date()) {
        const diff = Math.abs(new Date(toDate) - new Date(fromDate));
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
    }

    // Sanitize input
    static sanitizeInput(input) {
        if (typeof input === 'string') {
            return input
                .trim()
                .replace(/[<>]/g, '') // Remove HTML tags
                .replace(/'/g, "''") // Escape single quotes
                .substring(0, 1000); // Limit length
        }
        return input;
    }

    // Validate email
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validate password strength
    static isStrongPassword(password) {
        const minLength = 6;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

        return (
            password.length >= minLength &&
            hasUpperCase &&
            hasLowerCase &&
            hasNumbers &&
            hasSpecialChar
        );
    }

    // Paginate array
    static paginateArray(array, page = 1, limit = 10) {
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        
        const paginatedData = array.slice(startIndex, endIndex);
        
        return {
            data: paginatedData,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: array.length,
                totalPages: Math.ceil(array.length / limit),
                hasNext: endIndex < array.length,
                hasPrev: startIndex > 0
            }
        };
    }

    // Deep clone object
    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    // Merge objects
    static mergeObjects(target, source) {
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key]) target[key] = {};
                this.mergeObjects(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
        return target;
    }

    // Remove null/undefined values from object
    static cleanObject(obj) {
        const cleaned = {};
        for (const key in obj) {
            if (obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
                cleaned[key] = obj[key];
            }
        }
        return cleaned;
    }

    // Create directory if not exists
    static async ensureDirectoryExists(dirPath) {
        try {
            await fs.mkdir(dirPath, { recursive: true });
            return true;
        } catch (error) {
            console.error(`Error creating directory ${dirPath}:`, error);
            return false;
        }
    }

    // Generate file path with timestamp
    static generateFilePath(originalName, prefix = '') {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        const extension = path.extname(originalName);
        const fileName = `${prefix}${timestamp}_${random}${extension}`;
        return fileName;
    }

    // Format bytes to human readable size
    static formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // Delay execution
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Retry function with exponential backoff
    static async retry(fn, maxRetries = 3, delayMs = 1000) {
        let lastError;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                if (i < maxRetries - 1) {
                    await this.delay(delayMs * Math.pow(2, i)); // Exponential backoff
                }
            }
        }
        
        throw lastError;
    }

    // Validate URL
    static isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    // Generate slug from string
    static generateSlug(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-')     // Replace spaces with hyphens
            .replace(/-+/g, '-')      // Replace multiple hyphens with single
            .trim();
    }

    // Truncate string with ellipsis
    static truncateString(str, maxLength = 100) {
        if (str.length <= maxLength) return str;
        return str.substring(0, maxLength - 3) + '...';
    }

    // Get current timestamp in ISO format
    static getCurrentTimestamp() {
        return new Date().toISOString();
    }

    // Generate random color
    static generateRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    // Parse query string to object
    static parseQueryString(queryString) {
        const params = new URLSearchParams(queryString);
        const result = {};
        
        for (const [key, value] of params) {
            result[key] = value;
        }
        
        return result;
    }

    // Stringify object to query string
    static stringifyQueryObject(obj) {
        const params = new URLSearchParams();
        
        for (const [key, value] of Object.entries(obj)) {
            if (value !== undefined && value !== null) {
                params.append(key, value.toString());
            }
        }
        
        return params.toString();
    }
}

module.exports = Helpers;