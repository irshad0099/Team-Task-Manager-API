const cron = require('node-cron');
const Activity = require('../models/Activity');
const fs = require('fs').promises;
const path = require('path');

class ActivityLogger {
    constructor() {
        this.logFile = path.join(__dirname, '../../logs/activity.log');
        this.init();
    }

    async init() {
        // Ensure logs directory exists
        try {
            await fs.mkdir(path.dirname(this.logFile), { recursive: true });
        } catch (error) {
            console.error('Error creating logs directory:', error);
        }

        // Schedule cron job to run every minute
        cron.schedule('* * * * *', async () => {
            await this.processActivities();
        });
    }

    async processActivities() {
        try {
            // Find unprocessed activities (limit 100 per run)
            const activities = await Activity.find({ 
                processed: false 
            }).limit(100).populate('performedBy', 'name email');

            for (const activity of activities) {
                // Format log entry
                const logEntry = `${new Date().toISOString()} | ${activity.action} | ${activity.entityType} | ${activity.entityId} | ${activity.performedBy.name} | ${JSON.stringify(activity.details)}\n`;

                // Write to log file
                await fs.appendFile(this.logFile, logEntry);

                // Mark as processed
                activity.processed = true;
                await activity.save();
            }

            console.log(`Processed ${activities.length} activities`);
        } catch (error) {
            console.error('Error processing activities:', error);
        }
    }
}

module.exports = new ActivityLogger();