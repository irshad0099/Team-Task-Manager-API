const express = require('express');
const router = express.Router();
const { getActivities } = require('../controllers/activityController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router.get('/:teamId/activities', getActivities);

module.exports = router;