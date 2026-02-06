const Queue = require('bull');
const Activity = require('../models/Activity');
const fs = require('fs').promises;
const path = require('path');

class QueueService {
    constructor() {
        this.queues = {};
        this.init();
    }

    async init() {
        // Create activity logging queue
        this.queues.activity = new Queue('activity-logging', {
            redis: {
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                password: process.env.REDIS_PASSWORD || undefined
            },
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000
                },
                removeOnComplete: true,
                removeOnFail: false
            }
        });

        // Setup processors
        this.setupProcessors();

        // Setup queue monitoring
        this.setupMonitoring();

        console.log('Queue service initialized');
    }

    setupProcessors() {
        // Activity logging processor
        this.queues.activity.process('log-activity', async (job) => {
            const { activityId } = job.data;
            
            try {
                const activity = await Activity.findById(activityId);
                if (!activity) {
                    throw new Error(`Activity ${activityId} not found`);
                }

                if (activity.processed) {
                    return { message: 'Activity already processed' };
                }

                // Process the activity
                await this.processActivity(activity);

                // Mark as processed
                activity.processed = true;
                await activity.save();

                return { 
                    success: true, 
                    activityId,
                    processedAt: new Date() 
                };
            } catch (error) {
                console.error(`Error processing activity ${activityId}:`, error);
                throw error;
            }
        });

        // Email notification processor (example)
        this.queues.activity.process('send-notification', async (job) => {
            const { type, userId, data } = job.data;
            
            // This is a placeholder for email sending logic
            console.log(`Sending ${type} notification to user ${userId}`);
            console.log('Notification data:', data);

            // Simulate email sending
            await new Promise(resolve => setTimeout(resolve, 1000));

            return { 
                success: true, 
                type, 
                userId,
                sentAt: new Date() 
            };
        });
    }

    async processActivity(activity) {
        // Create log directory if it doesn't exist
        const logDir = path.join(__dirname, '../../logs');
        await fs.mkdir(logDir, { recursive: true });

        // Format log entry
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            activityId: activity._id.toString(),
            action: activity.action,
            entityType: activity.entityType,
            entityId: activity.entityId.toString(),
            performedBy: activity.performedBy.toString(),
            details: activity.details
        };

        // Write to daily log file
        const date = new Date().toISOString().split('T')[0];
        const logFile = path.join(logDir, `activity-${date}.log`);
        
        await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');

        // Also log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.log('Activity logged:', logEntry);
        }
    }

    setupMonitoring() {
        // Log queue events
        this.queues.activity.on('completed', (job, result) => {
            console.log(`Job ${job.id} completed:`, result);
        });

        this.queues.activity.on('failed', (job, error) => {
            console.error(`Job ${job.id} failed:`, error.message);
        });

        this.queues.activity.on('stalled', (job) => {
            console.warn(`Job ${job.id} stalled`);
        });

        // Monitor queue size periodically
        setInterval(async () => {
            try {
                const counts = await this.queues.activity.getJobCounts();
                if (counts.waiting > 100 || counts.failed > 10) {
                    console.warn('Queue monitoring alert:', counts);
                }
            } catch (error) {
                console.error('Queue monitoring error:', error);
            }
        }, 60000); // Check every minute
    }

    // Add activity to queue
    async addActivity(data) {
        try {
            const job = await this.queues.activity.add('log-activity', data, {
                priority: 1, // High priority for activities
                delay: 1000, // Process after 1 second
                lifo: false // FIFO order
            });

            return {
                success: true,
                jobId: job.id,
                timestamp: new Date()
            };
        } catch (error) {
            console.error('Error adding activity to queue:', error);
            throw error;
        }
    }

    // Add notification to queue
    async addNotification(type, userId, data) {
        try {
            const job = await this.queues.activity.add('send-notification', {
                type,
                userId,
                data
            }, {
                priority: 2, // Medium priority for notifications
                attempts: 5 // More attempts for notifications
            });

            return {
                success: true,
                jobId: job.id,
                timestamp: new Date()
            };
        } catch (error) {
            console.error('Error adding notification to queue:', error);
            throw error;
        }
    }

    // Get queue statistics
    async getQueueStats() {
        try {
            const counts = await this.queues.activity.getJobCounts();
            const waitingJobs = await this.queues.activity.getWaiting(0, 10);
            const failedJobs = await this.queues.activity.getFailed(0, 10);

            return {
                counts,
                waitingJobs: waitingJobs.map(job => ({
                    id: job.id,
                    name: job.name,
                    timestamp: job.timestamp
                })),
                failedJobs: failedJobs.map(job => ({
                    id: job.id,
                    name: job.name,
                    failedReason: job.failedReason,
                    timestamp: job.timestamp
                }))
            };
        } catch (error) {
            console.error('Error getting queue stats:', error);
            throw error;
        }
    }

    // Clean old jobs
    async cleanOldJobs(days = 7) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            // Clean completed jobs older than X days
            await this.queues.activity.clean(
                604800000 * days, // X days in milliseconds
                'completed'
            );

            // Clean failed jobs older than X days
            await this.queues.activity.clean(
                604800000 * days, // X days in milliseconds
                'failed'
            );

            console.log(`Cleaned jobs older than ${days} days`);
            return { success: true };
        } catch (error) {
            console.error('Error cleaning old jobs:', error);
            throw error;
        }
    }

    // Pause queue
    async pause() {
        await this.queues.activity.pause();
        return { success: true, paused: true };
    }

    // Resume queue
    async resume() {
        await this.queues.activity.resume();
        return { success: true, paused: false };
    }

    // Health check
    async healthCheck() {
        try {
            const counts = await this.queues.activity.getJobCounts();
            return {
                status: 'healthy',
                timestamp: new Date(),
                queueStats: counts
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date()
            };
        }
    }
}

module.exports = new QueueService();