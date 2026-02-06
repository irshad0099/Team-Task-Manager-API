module.exports = {
    // HTTP Status Codes
    HTTP_STATUS: {
        OK: 200,
        CREATED: 201,
        ACCEPTED: 202,
        NO_CONTENT: 204,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        CONFLICT: 409,
        UNPROCESSABLE_ENTITY: 422,
        INTERNAL_SERVER_ERROR: 500,
        SERVICE_UNAVAILABLE: 503
    },

    // Task Status
    TASK_STATUS: {
        TODO: 'TODO',
        DOING: 'DOING',
        DONE: 'DONE'
    },

    // Activity Actions
    ACTIVITY_ACTIONS: {
        CREATED: 'CREATED',
        UPDATED: 'UPDATED',
        DELETED: 'DELETED',
        MOVED: 'MOVED',
        ASSIGNED: 'ASSIGNED',
        COMMENTED: 'COMMENTED'
    },

    // Entity Types
    ENTITY_TYPES: {
        TASK: 'TASK',
        TEAM: 'TEAM',
        USER: 'USER'
    },

    // Team Roles
    TEAM_ROLES: {
        ADMIN: 'admin',
        MEMBER: 'member'
    },

    // Validation Messages
    VALIDATION_MESSAGES: {
        REQUIRED: '{PATH} is required',
        EMAIL: 'Please enter a valid email address',
        MIN_LENGTH: '{PATH} must be at least {VALUE} characters',
        MAX_LENGTH: '{PATH} cannot exceed {VALUE} characters',
        UNIQUE: '{PATH} must be unique',
        INVALID: 'Invalid {PATH}'
    },

    // Cache TTLs (in seconds)
    CACHE_TTL: {
        SHORT: 300,       // 5 minutes
        MEDIUM: 1800,     // 30 minutes
        LONG: 7200,       // 2 hours
        VERY_LONG: 86400  // 24 hours
    },

    // Rate Limiting
    RATE_LIMIT: {
        WINDOW_MS: 15 * 60 * 1000, // 15 minutes
        MAX_REQUESTS: 100
    },

    // Pagination
    PAGINATION: {
        DEFAULT_PAGE: 1,
        DEFAULT_LIMIT: 10,
        MAX_LIMIT: 100
    },

    // File upload
    FILE_UPLOAD: {
        MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
        ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
    },

    // JWT
    JWT: {
        EXPIRES_IN: '7d',
        ALGORITHM: 'HS256'
    },

    // Error Messages
    ERROR_MESSAGES: {
        NOT_FOUND: '{RESOURCE} not found',
        UNAUTHORIZED: 'Not authorized to access this resource',
        FORBIDDEN: 'You do not have permission to perform this action',
        INVALID_CREDENTIALS: 'Invalid credentials',
        DUPLICATE_ENTRY: '{RESOURCE} already exists',
        VALIDATION_ERROR: 'Validation failed',
        SERVER_ERROR: 'Internal server error',
        RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later'
    },

    // Success Messages
    SUCCESS_MESSAGES: {
        CREATED: '{RESOURCE} created successfully',
        UPDATED: '{RESOURCE} updated successfully',
        DELETED: '{RESOURCE} deleted successfully',
        FETCHED: '{RESOURCE} fetched successfully'
    }
};