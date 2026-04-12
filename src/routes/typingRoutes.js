const express = require('express');
const { getLeaderboard, submitTypingResult } = require('../controllers/typingController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/typing/submit - Submit a typing test result
router.post('/submit', verifyToken, submitTypingResult);

// GET /api/typing/leaderboard - Get typing leaderboard
// Public endpoint (no auth required so dashboard can load it)
router.get('/leaderboard', getLeaderboard);

module.exports = router;
