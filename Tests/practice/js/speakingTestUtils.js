/**
 * Speaking Test Utilities - IELTS Practice
 * Shared functions for saving speaking test scores and dashboard navigation
 */
(function() {
    'use strict';

    /**
     * Save speaking test score to localStorage and backend
     */
    window.saveSpeakingTestScore = function(score, band, testId, testName) {
        // Build result object
        const result = {
            testId: testId,
            overallBand: band ? String(band) : null,
            score: score,
            completedAt: new Date().toISOString(),
            skill: 'speaking'
        };

        // Save to localStorage
        let testScores = JSON.parse(localStorage.getItem('speaking_test_scores') || '{}');
        testScores[testId] = result;
        localStorage.setItem('speaking_test_scores', JSON.stringify(testScores));

        // Update speaking score
        if (band) {
            localStorage.setItem('speakingScore', String(band));
        }

        // Update test progress
        let progress = JSON.parse(localStorage.getItem('testProgress') || '{"listening":0,"reading":0,"writing":0,"speaking":0}');
        if (typeof progress === 'number') {
            progress = { listening: 0, reading: 0, writing: 0, speaking: progress };
        }
        if (!progress.speaking) progress.speaking = 0;
        const completedIds = Object.keys(testScores);
        progress.speaking = Math.max(progress.speaking, completedIds.length);
        localStorage.setItem('testProgress', JSON.stringify(progress));

        console.log('[SpeakingUtils] Saved speaking score to localStorage:', testId, score, band);

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
                    testType: 'SPEAKING',
                    testId: testId,
                    testName: testName || 'Speaking Test',
                    skillArea: 'SPEAKING',
                    score: parseFloat(band),
                    maxScore: 9.0,
                    status: 'COMPLETED',
                    feedback: 'Score: ' + score + '/40, Band: ' + band
                })
            }).then(function(res) { return res.json(); })
              .then(function(data) { console.log('[SpeakingUtils] Backend save:', data); })
              .catch(function(err) { console.warn('[SpeakingUtils] Backend save failed:', err); });
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
    window.saveSpeakingAndGoToDashboard = function(score, band, testId, testName) {
        window.saveSpeakingTestScore(score, band, testId, testName);
        showToast('✅ Your score has been stored!');
        setTimeout(function() {
            window.location.href = '/dashboard.html';
        }, 1200);
    };

    /**
     * Auto-detect test info from URL and save score
     */
    window.autoSaveSpeakingScore = function(score, band) {
        const path = window.location.pathname;
        const fileName = path.substring(path.lastIndexOf('/') + 1);
        let testId = 'S_' + fileName.replace(/[^a-zA-Z0-9]/g, '_');
        let testName = 'Speaking Test';

        const setMatch = fileName.match(/Set(\d+)/);
        if (setMatch) {
            const setNum = parseInt(setMatch[1], 10);
            if (path.includes('All-Parts')) {
                testId = 'S_AP_' + String(setNum).padStart(2, '0');
                testName = 'Speaking Full Test - Set ' + setNum;
            } else if (path.includes('Speaking-Part1')) {
                testId = 'S_P1_' + String(setNum).padStart(2, '0');
                testName = 'Speaking Part 1 - Set ' + setNum;
            } else if (path.includes('Speaking-Part2')) {
                testId = 'S_P2_' + String(setNum).padStart(2, '0');
                testName = 'Speaking Part 2 - Set ' + setNum;
            } else if (path.includes('Speaking-Part3')) {
                testId = 'S_P3_' + String(setNum).padStart(2, '0');
                testName = 'Speaking Part 3 - Set ' + setNum;
            }
        }

        window.saveSpeakingTestScore(score, band, testId, testName);
    };

    /**
     * Finish test and save with confirmation
     * For use in results modal
     */
    window.finishSpeakingAndSave = function() {
        // For speaking tests, we may not have a numeric score
        // Try to extract from results modal if available
        var overallScoreEl = document.getElementById('resultsOverallScore');
        var band = '0.0';
        if (overallScoreEl && overallScoreEl.textContent && overallScoreEl.textContent !== '—') {
            band = overallScoreEl.textContent;
        }
        
        window.autoSaveSpeakingScore(null, band);
        showToast('✅ Your score has been stored!');
        setTimeout(function() {
            window.location.href = '/dashboard.html';
        }, 1200);
    };

    /**
     * Simple finish for Part 1/2/3 tests without AI scoring
     */
    window.finishSpeakingTest = function() {
        window.autoSaveSpeakingScore(null, null);
        showToast('✅ Your test has been saved!');
        setTimeout(function() {
            window.location.href = '/dashboard.html';
        }, 1200);
    };

    console.log('[SpeakingUtils] Speaking test utilities loaded');
})();
