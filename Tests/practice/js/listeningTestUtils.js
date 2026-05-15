/**
 * Listening Test Utilities - IELTS Practice
 * Shared functions for saving listening test scores and dashboard navigation
 */
(function() {
    'use strict';

    /**
     * Save listening test score to localStorage and backend
     */
    window.saveListeningTestScore = function(score, band, testId, testName) {
        // Build result object
        const result = {
            testId: testId,
            overallBand: band ? String(band) : null,
            score: score,
            completedAt: new Date().toISOString(),
            skill: 'listening'
        };

        // Save to localStorage
        let testScores = JSON.parse(localStorage.getItem('listening_test_scores') || '{}');
        testScores[testId] = result;
        localStorage.setItem('listening_test_scores', JSON.stringify(testScores));

        // Update listening score
        if (band) {
            localStorage.setItem('listeningScore', String(band));
        }

        // Update test progress
        let progress = JSON.parse(localStorage.getItem('testProgress') || '{"listening":0,"reading":0,"writing":0,"speaking":0}');
        if (typeof progress === 'number') {
            progress = { listening: progress, reading: 0, writing: 0, speaking: 0 };
        }
        if (!progress.listening) progress.listening = 0;
        const completedIds = Object.keys(testScores);
        progress.listening = Math.max(progress.listening, completedIds.length);
        localStorage.setItem('testProgress', JSON.stringify(progress));

        console.log('[ListeningUtils] Saved listening score to localStorage:', testId, score, band);

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
                    testType: 'LISTENING',
                    testId: testId,
                    testName: testName || 'Listening Test',
                    skillArea: 'LISTENING',
                    score: parseFloat(band),
                    maxScore: 9.0,
                    status: 'COMPLETED',
                    feedback: 'Score: ' + score + '/40, Band: ' + band
                })
            }).then(function(res) { return res.json(); })
              .then(function(data) { console.log('[ListeningUtils] Backend save:', data); })
              .catch(function(err) { console.warn('[ListeningUtils] Backend save failed:', err); });
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
    window.saveListeningAndGoToDashboard = function(score, band, testId, testName) {
        window.saveListeningTestScore(score, band, testId, testName);
        showToast('\u2705 Your score has been stored!');
        setTimeout(function() {
            window.location.href = '/dashboard.html';
        }, 1200);
    };

    /**
     * Auto-detect test info from URL and save score
     */
    window.autoSaveListeningScore = function(score, band) {
        const path = window.location.pathname;
        const fileName = path.substring(path.lastIndexOf('/') + 1);
        let testId = 'L_' + fileName.replace(/[^a-zA-Z0-9]/g, '_');
        let testName = 'Listening Test';

        const setMatch = fileName.match(/Set(\d+)/);
        if (setMatch) {
            const setNum = parseInt(setMatch[1], 10);
            if (path.includes('All-parts')) {
                testId = 'L_AP_' + String(setNum).padStart(2, '0');
                testName = 'Listening Full Test - Set ' + setNum;
            }
        }

        window.saveListeningTestScore(score, band, testId, testName);
    };

    /**
     * Read score from results modal and save + redirect with confirmation
     */
    window.finishListeningAndSave = function() {
        var scoreSummary = document.getElementById('score-summary');
        var score = 0;
        var band = '0.0';
        if (scoreSummary && scoreSummary.textContent) {
            var text = scoreSummary.textContent;
            var scoreMatch = text.match(/(\d+)\s+out\s+of/);
            var bandMatch = text.match(/Band\s+([\d.]+)/);
            if (scoreMatch) score = parseInt(scoreMatch[1], 10);
            if (bandMatch) band = bandMatch[1];
        }
        window.autoSaveListeningScore(score, band);
        showToast('\u2705 Your score has been stored!');
        setTimeout(function() {
            window.location.href = '/dashboard.html';
        }, 1200);
    };

    console.log('[ListeningUtils] Listening test utilities loaded');
})();
