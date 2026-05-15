/**
 * Reading Test Utilities - IELTS Practice
 * Shared functions for saving reading test scores and dashboard navigation
 */
(function() {
    'use strict';

    /**
     * Save reading test score to localStorage and backend
     */
    window.saveReadingTestScore = function(score, band, testId, testName) {
        // Build result object
        const result = {
            testId: testId,
            overallBand: band ? String(band) : null,
            score: score,
            completedAt: new Date().toISOString(),
            skill: 'reading'
        };

        // Save to localStorage
        let testScores = JSON.parse(localStorage.getItem('reading_test_scores') || '{}');
        testScores[testId] = result;
        localStorage.setItem('reading_test_scores', JSON.stringify(testScores));

        // Update reading score
        if (band) {
            localStorage.setItem('readingScore', String(band));
        }

        // Update test progress
        let progress = JSON.parse(localStorage.getItem('testProgress') || '{"listening":0,"reading":0,"writing":0,"speaking":0}');
        if (typeof progress === 'number') {
            progress = { listening: 0, reading: progress, writing: 0, speaking: 0 };
        }
        if (!progress.reading) progress.reading = 0;
        const completedIds = Object.keys(testScores);
        progress.reading = Math.max(progress.reading, completedIds.length);
        localStorage.setItem('testProgress', JSON.stringify(progress));

        console.log('[ReadingUtils] Saved reading score to localStorage:', testId, score, band);

        // Save to backend if user is logged in
        const token = localStorage.getItem('authToken')
            || localStorage.getItem('token')
            || localStorage.getItem('ielts_token')
            || sessionStorage.getItem('authToken')
            || sessionStorage.getItem('token')
            || sessionStorage.getItem('ielts_token')
            || null;

        if (token && band) {
            fetch('/api/statistics/attempt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({
                    testType: 'READING',
                    testId: testId,
                    testName: testName || 'Reading Test',
                    skillArea: 'READING',
                    score: parseFloat(band),
                    maxScore: 9.0,
                    status: 'COMPLETED',
                    feedback: 'Score: ' + score + '/40, Band: ' + band
                })
            }).then(function(res) { return res.json(); })
              .then(function(data) { console.log('[ReadingUtils] Backend save:', data); })
              .catch(function(err) { console.warn('[ReadingUtils] Backend save failed:', err); });
        }
    };

    /**
     * Show toast notification
     */
    function showToast(message, duration) {
        duration = duration || 2500;
        const toast = document.createElement('div');
        toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#4CAF50;color:#fff;padding:12px 24px;border-radius:8px;font-weight:bold;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,0.2);font-family:sans-serif;font-size:14px;';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(function() {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.5s';
            setTimeout(function() { toast.remove(); }, 500);
        }, duration);
    }

    /**
     * Save score and redirect to dashboard with confirmation
     */
    window.saveAndGoToDashboard = function(score, band, testId, testName) {
        window.saveReadingTestScore(score, band, testId, testName);
        showToast('\u2705 Your score has been stored!');
        setTimeout(function() {
            window.location.href = '/dashboard.html';
        }, 1200);
    };

    /**
     * Auto-detect test info from URL and save score
     */
    window.autoSaveReadingScore = function(score, band) {
        const path = window.location.pathname;
        const fileName = path.substring(path.lastIndexOf('/') + 1);
        let testId = 'R_' + fileName.replace(/[^a-zA-Z0-9]/g, '_');
        let testName = 'Reading Test';

        const setMatch = fileName.match(/Set(\d+)/);
        if (setMatch) {
            const setNum = parseInt(setMatch[1], 10);
            if (path.includes('All-Passages')) {
                testId = 'R_AP_' + String(setNum).padStart(2, '0');
                testName = 'Reading Full Test - Set ' + setNum;
            } else if (path.includes('Reading-Part1')) {
                testId = 'R_P1_' + String(setNum).padStart(2, '0');
                testName = 'Reading Part 1 - Set ' + setNum;
            } else if (path.includes('Reading-Part2')) {
                testId = 'R_P2_' + String(setNum).padStart(2, '0');
                testName = 'Reading Part 2 - Set ' + setNum;
            } else if (path.includes('Reading-Part3')) {
                testId = 'R_P3_' + String(setNum).padStart(2, '0');
                testName = 'Reading Part 3 - Set ' + setNum;
            }
        }

        window.saveReadingTestScore(score, band, testId, testName);
    };

    /**
     * Read score from results modal and save + redirect with confirmation
     */
    window.finishAndSave = function() {
        var scoreEl = document.getElementById('results-score');
        var bandEl = document.getElementById('results-band');
        var score = scoreEl ? parseInt(scoreEl.textContent) || 0 : 0;
        var band = bandEl ? bandEl.textContent || '0.0' : '0.0';
        window.autoSaveReadingScore(score, band);
        showToast('\u2705 Your score has been stored!');
        setTimeout(function() {
            window.location.href = '/dashboard.html';
        }, 1200);
    };

    console.log('[ReadingUtils] Reading test utilities loaded');
})();
