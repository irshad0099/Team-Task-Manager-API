const express = require('express');
const router = express.Router();
const { 
    createTeam, 
    addMember, 
    removeMember, 
    getMembers, 
    getMyTeams 
} = require('../controllers/teamController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router.post('/', createTeam);
router.get('/my-teams', getMyTeams);
router.post('/:teamId/members', addMember);
router.delete('/:teamId/members/:userId', removeMember);
router.get('/:teamId/members', getMembers);

module.exports = router;