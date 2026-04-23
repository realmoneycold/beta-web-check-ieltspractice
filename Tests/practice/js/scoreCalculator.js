/**
 * IELTS Score Calculator Module
 * Calculates scores from correct answers and sends to API
 */
(function() {
    'use strict';

    // IELTS Band Score conversion tables
    const bandScores = {
        reading: {39:9,38:8.5,37:8.5,36:8,35:8,34:7.5,33:7.5,32:7,31:7,30:6.5,29:6.5,28:6,27:6,26:5.5,25:5.5,24:5,23:5,22:4.5,21:4.5,20:4,19:4,18:3.5,17:3.5,16:3,15:3,14:2.5,13:2.5,12:2,11:2,10:1.5,9:1.5,8:1,7:1,6:0.5,5:0.5,4:0,3:0,2:0,1:0,0:0},
        listening: {39:9,38:9,37:8.5,36:8.5,35:8,34:8,33:7.5,32:7.5,31:7,30:7,29:6.5,28:6.5,27:6,26:6,25:5.5,24:5.5,23:5,22:5,21:4.5,20:4.5,19:4,18:4,17:3.5,16:3.5,15:3,14:3,13:2.5,12:2.5,11:2,10:2,9:1.5,8:1.5,7:1,6:1,5:0.5,4:0.5,3:0,2:0,1:0,0:0}
    };

    // Calculate band score from raw score
    window.calculateIELTSBand = function(correct, total, type) {
        if (type === 'reading' || type === 'listening') {
            return bandScores[type][correct] || 0;
        }
        // Writing/Speaking: return as-is (manual scoring)
        return correct;
    };

    // Decode JWT payload without verification (to check expiration)
    function decodeJWT(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            return null;
        }
    }

    // Check if token is expired
    function isTokenExpired(token) {
        const decoded = decodeJWT(token);
        if (!decoded || !decoded.exp) return true; // Assume expired if can't decode
        const now = Math.floor(Date.now() / 1000);
        return decoded.exp < now;
    }

    // Count correct answers from radio/checkbox inputs
    window.countCorrectAnswers = function(selector, correctAttribute = 'data-correct') {
        const inputs = document.querySelectorAll(selector);
        let correct = 0;
        inputs.forEach(input => {
            if (input.checked && input.getAttribute(correctAttribute) === 'true') {
                correct++;
            }
        });
        return correct;
    };

    // Save test with score
    window.saveTestWithScore = async function(config) {
        const bandScore = window.calculateIELTSBand(config.correct, config.total, config.testType.toLowerCase());
        const percentage = Math.round((config.correct / config.total) * 100);
        
        const testData = {
            testType: config.testType,
            testId: config.testId,
            testName: config.testName,
            skillArea: config.skillArea,
            score: bandScore,
            maxScore: 9.0,
            answersCorrect: config.correct,
            answersTotal: config.total,
            percentageScore: percentage,
            timeSpentSeconds: config.timeSpent || Math.floor((Date.now() - window.testStartTime) / 1000),
            status: 'COMPLETED'
        };

        // Check multiple possible token keys for compatibility
        const token = localStorage.getItem('token') || 
                      localStorage.getItem('ielts_token') || 
                      localStorage.getItem('authToken') ||
                      sessionStorage.getItem('token') ||
                      sessionStorage.getItem('ielts_token');
        if (!token) {
            console.error('[ScoreCalc] No auth token found. Checked: token, ielts_token, authToken');
            console.error('[ScoreCalc] Available localStorage keys:', Object.keys(localStorage).filter(k => k.includes('token') || k.includes('auth')));
            return {success: false, score: bandScore, percentage};
        }
        console.log('[ScoreCalc] Token found, proceeding with save...');

        // Debug: Show token info (first/last 10 chars only for security)
        console.log('[ScoreCalc] Token (truncated):', token.substring(0, 10) + '...' + token.substring(token.length - 10));
        
        // Check if token looks like a JWT (should have 3 parts separated by dots)
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
            console.error('[ScoreCalc] Token does not appear to be a valid JWT (expected 3 parts, got', tokenParts.length, ')');
        }
        
        // Check token expiration
        if (isTokenExpired(token)) {
            console.error('[ScoreCalc] Token is expired! Please log in again.');
            alert('Your session has expired. Please return to the dashboard and log in again.');
            return {success: false, score: bandScore, percentage, error: 'Token expired'};
        }
        
        // Log decoded token info (for debugging)
        const decoded = decodeJWT(token);
        if (decoded) {
            console.log('[ScoreCalc] Token payload:', {id: decoded.id, role: decoded.role, exp: new Date(decoded.exp * 1000).toISOString()});
        }

        try {
            const response = await fetch('/api/statistics/attempt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(testData)
            });

            if (response.ok) {
                console.log('[ScoreCalc] Score saved:', {band: bandScore, percentage, correct: config.correct});
                return {success: true, score: bandScore, percentage, data: await response.json()};
            } else {
                // Handle specific error codes
                const errorText = await response.text();
                console.error('[ScoreCalc] Server error:', response.status, response.statusText);
                console.error('[ScoreCalc] Error details:', errorText);
                
                if (response.status === 401) {
                    console.error('[ScoreCalc] Token is expired or invalid. Try logging out and back in.');
                    // Show a user-friendly alert
                    alert('Your session has expired. Please return to the dashboard and log in again.');
                }
                
                return {success: false, score: bandScore, percentage, error: response.status, errorDetails: errorText};
            }
        } catch (error) {
            console.error('[ScoreCalc] Network/Error:', error);
            return {success: false, score: bandScore, percentage, error: error.message};
        }
    };

    console.log('[ScoreCalc] Score calculator loaded');
})();
