const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    action: {
        type: String,
        enum: ['CREATED', 'UPDATED', 'MOVED', 'ASSIGNED', 'COMMENTED'],
        required: true
    },
    entityType: {
        type: String,
        enum: ['TASK', 'TEAM'],
        required: true
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    details: {
        type: Object,
        default: {}
    },
    processed: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

activitySchema.index({ entityId: 1, createdAt: -1 });
activitySchema.index({ processed: 1 });

module.exports = mongoose.model('Activity', activitySchema);