'use strict';

const prisma = require('../models/prisma');

// ─── GET LEADERBOARD ────────────────────────────────────────────────────────
// GET /api/typing/leaderboard
// Query params: limit (default 10, max 100), period ('all'|'weekly'|'monthly'), userId (optional)
async function getLeaderboard(req, res) {
  try {
    let { limit = 10, period = 'all', userId } = req.query;

    // Sanitize limit
    limit = parseInt(limit) || 10;
    if (limit > 100) limit = 100;
    if (limit < 1) limit = 1;

    // Sanitize period
    const validPeriods = ['all', 'weekly', 'monthly'];
    if (!validPeriods.includes(period)) period = 'all';

    // Build date filter
    let dateFilter = {};
    if (period === 'weekly') {
      const from = new Date();
      from.setDate(from.getDate() - 7);
      dateFilter = { date: { gte: from } };
    } else if (period === 'monthly') {
      const from = new Date();
      from.setDate(from.getDate() - 30);
      dateFilter = { date: { gte: from } };
    }

    // Aggregate all typing results per user
    const allResults = await prisma.typingResult.findMany({
      where: dateFilter,
      select: {
        userId: true,
        wpm: true,
        accuracy: true,
        date: true,
        user: {
          select: {
            id: true,
            full_name: true,
            username: true,
            country: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // If no results, return empty
    if (!allResults.length) {
      return res.status(200).json({
        success: true,
        data: {
          period,
          byWpm: [],
          byAccuracy: [],
          userRank: null,
        },
      });
    }

    // Aggregate per user: best WPM, avg accuracy, test count
    const userMap = {};
    for (const r of allResults) {
      const uid = r.userId;
      if (!userMap[uid]) {
        userMap[uid] = {
          userId: uid,
          name: r.user.full_name || r.user.username || 'Anonymous',
          username: r.user.username || null,
          country: r.user.country || null,
          bestWpm: 0,
          totalWpm: 0,
          totalAccuracy: 0,
          testsCompleted: 0,
        };
      }
      userMap[uid].testsCompleted += 1;
      userMap[uid].totalWpm += r.wpm;
      userMap[uid].totalAccuracy += r.accuracy;
      if (r.wpm > userMap[uid].bestWpm) {
        userMap[uid].bestWpm = r.wpm;
      }
    }

    const aggregated = Object.values(userMap).map((u) => ({
      ...u,
      avgWpm: Math.round(u.totalWpm / u.testsCompleted),
      avgAccuracy: parseFloat((u.totalAccuracy / u.testsCompleted).toFixed(1)),
    }));

    // Sort by best WPM
    const byWpm = [...aggregated]
      .sort((a, b) => b.bestWpm - a.bestWpm)
      .slice(0, limit)
      .map((u, i) => ({
        rank: i + 1,
        name: u.name,
        username: u.username,
        country: u.country,
        wpm: u.bestWpm,
        avgWpm: u.avgWpm,
        accuracy: u.avgAccuracy,
        testsCompleted: u.testsCompleted,
        userId: u.userId,
      }));

    // Sort by best accuracy (among those with ≥1 test)
    const byAccuracy = [...aggregated]
      .sort((a, b) => b.avgAccuracy - a.avgAccuracy)
      .slice(0, limit)
      .map((u, i) => ({
        rank: i + 1,
        name: u.name,
        username: u.username,
        country: u.country,
        wpm: u.bestWpm,
        avgWpm: u.avgWpm,
        accuracy: u.avgAccuracy,
        testsCompleted: u.testsCompleted,
        userId: u.userId,
      }));

    // Optional: find requesting user's rank
    let userRank = null;
    const requestUserId = userId ? parseInt(userId) : (req.user?.id || null);
    if (requestUserId) {
      const allByWpm = [...aggregated].sort((a, b) => b.bestWpm - a.bestWpm);
      const wpmRankIdx = allByWpm.findIndex((u) => u.userId === requestUserId);

      const allByAcc = [...aggregated].sort((a, b) => b.avgAccuracy - a.avgAccuracy);
      const accRankIdx = allByAcc.findIndex((u) => u.userId === requestUserId);

      if (wpmRankIdx !== -1) {
        const u = allByWpm[wpmRankIdx];
        userRank = {
          wpmRank: wpmRankIdx + 1,
          accuracyRank: accRankIdx + 1,
          bestWpm: u.bestWpm,
          avgAccuracy: u.avgAccuracy,
          testsCompleted: u.testsCompleted,
          totalUsers: aggregated.length,
          // Nearby users (±2 around user's WPM rank)
          nearbyByWpm: allByWpm
            .slice(Math.max(0, wpmRankIdx - 2), wpmRankIdx + 3)
            .map((u2, idx) => ({
              rank: Math.max(1, wpmRankIdx - 2) + idx + 1,
              name: u2.name,
              wpm: u2.bestWpm,
              accuracy: u2.avgAccuracy,
              isCurrentUser: u2.userId === requestUserId,
            })),
        };
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        period,
        totalUsers: aggregated.length,
        byWpm,
        byAccuracy,
        userRank,
      },
    });
  } catch (err) {
    console.error('Get typing leaderboard error:', err);
    return res.status(500).json({ success: false, message: 'Database error' });
  }
}

// ─── SUBMIT TYPING RESULT ──────────────────────────────────────────────────
// POST /api/typing/submit
async function submitTypingResult(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { wpm, accuracy, durationMinutes } = req.body;

    if (typeof wpm !== 'number' || typeof accuracy !== 'number') {
      return res.status(400).json({ success: false, message: 'wpm and accuracy are required numbers' });
    }
    if (wpm < 0 || wpm > 300) {
      return res.status(400).json({ success: false, message: 'wpm must be between 0 and 300' });
    }
    if (accuracy < 0 || accuracy > 100) {
      return res.status(400).json({ success: false, message: 'accuracy must be between 0 and 100' });
    }

    const result = await prisma.typingResult.create({
      data: {
        userId,
        wpm: parseFloat(wpm),
        accuracy: parseFloat(accuracy),
        durationMinutes: durationMinutes ? parseInt(durationMinutes) : 2,
      },
    });

    // Update study streak for today
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    await prisma.studyStreak.upsert({
      where: { userId_date: { userId, date: today } },
      update: { isCompleted: true },
      create: { userId, date: today, isCompleted: true },
    });

    return res.status(201).json({
      success: true,
      message: 'Typing result saved',
      data: result,
    });
  } catch (err) {
    console.error('Submit typing result error:', err);
    return res.status(500).json({ success: false, message: 'Database error' });
  }
}

module.exports = {
  getLeaderboard,
  submitTypingResult,
};
