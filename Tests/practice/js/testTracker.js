/**
 * Test Tracking Module - IELTS Practice
 * Saves test completion data to statistics API
 */

(function() {
    'use strict';

    // Store test start time
    window.testStartTime = Date.now();

    /**
     * Save test completion to statistics API
     * @param {Object} config - Test configuration
     * @param {string} config.testType - 'SPEAKING', 'WRITING', 'READING', 'LISTENING'
     * @param {string} config.testId - Unique test identifier (e.g., 'Speaking-Part1-Set1')
     * @param {string} config.testName - Human-readable test name
     * @param {string} config.skillArea - Specific skill area (e.g., 'SPEAKING_PART_1')
     * @param {number} config.score - User's score (optional)
     * @param {number} config.answersCorrect - Number of correct answers
     * @param {number} config.answersTotal - Total number of questions
     * @param {string} config.feedback - User feedback (optional)
     * @returns {Promise<boolean>} - Success status
     */
    /**
     * Get auth token from any known storage key
     */
    function getAuthToken() {
        return localStorage.getItem('authToken')
            || localStorage.getItem('token')
            || localStorage.getItem('ielts_token')
            || sessionStorage.getItem('authToken')
            || sessionStorage.getItem('token')
            || sessionStorage.getItem('ielts_token')
            || null;
    }

    window.saveTestCompletion = async function(config) {
        const token = getAuthToken();
        
        // Always save to localStorage so dashboard can show it even offline
        if (config.testType === 'WRITING') {
            saveWritingCompletionToLocalStorage(config);
        }
        
        if (!token) {
            console.log('[TestTracker] No auth token, skipping backend test tracking');
            return false;
        }

        // Default config values
        const testData = {
            testType: config.testType || 'UNKNOWN',
            testId: config.testId || 'unknown-test',
            testName: config.testName || 'Unknown Test',
            skillArea: config.skillArea || null,
            score: config.score || null,
            maxScore: 9.0,
            timeSpentSeconds: Math.floor((Date.now() - window.testStartTime) / 1000),
            status: 'COMPLETED',
            answersCorrect: config.answersCorrect || null,
            answersTotal: config.answersTotal || null,
            feedback: config.feedback || null
        };

        try {
            console.log('[TestTracker] Saving test completion:', testData);
            
            const response = await fetch('/api/statistics/attempt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(testData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('[TestTracker] Test completion saved successfully:', result);
                // Also save to localStorage for dashboard display
                if (config.testType === 'WRITING' && config.score) {
                    saveWritingCompletionToLocalStorage(config);
                }
                return true;
            } else {
                const errorText = await response.text();
                console.error('[TestTracker] Failed to save test completion:', errorText);
                return false;
            }
        } catch (error) {
            console.error('[TestTracker] Error saving test completion:', error);
            return false;
        }
    };

    /**
     * Handle test completion with tracking and redirect
     * @param {Object} config - Test configuration (same as saveTestCompletion)
     * @param {string} redirectUrl - URL to redirect after tracking
     */
    window.completeTest = async function(config, redirectUrl) {
        console.log('[TestTracker] Completing test...');
        
        // Save test data
        await window.saveTestCompletion(config);
        
        // Redirect
        if (redirectUrl) {
            console.log('[TestTracker] Redirecting to:', redirectUrl);
            window.location.href = redirectUrl;
        }
    };

    /**
     * Save writing test completion to localStorage for dashboard display
     */
    function saveWritingCompletionToLocalStorage(config) {
        try {
            const path = window.location.pathname;
            const decodedPath = decodeURIComponent(path);
            const fileName = path.substring(path.lastIndexOf('/') + 1);
            let testId = config.testId || null;

            // Auto-generate testId from URL if not provided
            if (!testId) {
                const allTasksMatch = fileName.match(/All-Tasks-Set(\d+)/);
                if (allTasksMatch) {
                    testId = 'W_AT_' + String(parseInt(allTasksMatch[1])).padStart(2, '0');
                }
                const setMatch = fileName.match(/Set(\d+)/);
                if (!testId && setMatch) {
                    const setNum = parseInt(setMatch[1], 10);
                    if (decodedPath.includes('Graph') || decodedPath.includes('Chart') || decodedPath.includes('Table')) {
                        testId = 'W_T1_GRAPH_' + String(setNum).padStart(2, '0');
                    } else if (decodedPath.includes('Process') || decodedPath.includes('Diagram')) {
                        testId = 'W_T1_PROC_' + String(setNum).padStart(2, '0');
                    } else if (decodedPath.includes('Map')) {
                        testId = 'W_T1_MAP_' + String(setNum).padStart(2, '0');
                    } else if (decodedPath.includes('Opinion')) {
                        testId = 'W_T2_OPINION_' + String(setNum).padStart(2, '0');
                    } else if (decodedPath.includes('Discussion')) {
                        testId = 'W_T2_DISCUSSION_' + String(setNum).padStart(2, '0');
                    } else if (decodedPath.includes('Problem') || decodedPath.includes('Solution')) {
                        testId = 'W_T2_PROBLEM_' + String(setNum).padStart(2, '0');
                    } else if (decodedPath.includes('Advantages')) {
                        testId = 'W_T2_ADV_' + String(setNum).padStart(2, '0');
                    } else if (decodedPath.includes('Direct')) {
                        testId = 'W_T2_DIRECT_' + String(setNum).padStart(2, '0');
                    }
                }
                const task2Match = fileName.match(/Writing-Part2-Set(\d+)/);
                if (!testId && task2Match) {
                    const setNum = parseInt(task2Match[1], 10);
                    if (decodedPath.includes('Opinion')) testId = 'W_T2_OPINION_' + String(setNum).padStart(2, '0');
                    else if (decodedPath.includes('Discussion')) testId = 'W_T2_DISCUSSION_' + String(setNum).padStart(2, '0');
                    else if (decodedPath.includes('Problem') || decodedPath.includes('Solution')) testId = 'W_T2_PROBLEM_' + String(setNum).padStart(2, '0');
                    else if (decodedPath.includes('Advantages')) testId = 'W_T2_ADV_' + String(setNum).padStart(2, '0');
                    else if (decodedPath.includes('Direct')) testId = 'W_T2_DIRECT_' + String(setNum).padStart(2, '0');
                }
                if (!testId) {
                    testId = 'W_' + fileName.replace(/[^a-zA-Z0-9]/g, '_');
                }
            }

            // Build result
            const result = {
                testId: testId,
                overallBand: config.score ? String(config.score) : null,
                taskType: config.skillArea || 'WRITING',
                completedAt: new Date().toISOString(),
                skill: 'writing'
            };

            // Save to localStorage
            let testScores = JSON.parse(localStorage.getItem('writing_test_scores') || '{}');
            testScores[testId] = result;
            localStorage.setItem('writing_test_scores', JSON.stringify(testScores));

            // Update writing score if we have one
            if (config.score) {
                localStorage.setItem('writingScore', String(config.score));
            }

            // Update test progress
            let progress = JSON.parse(localStorage.getItem('testProgress') || '{"listening":0,"reading":0,"writing":0,"speaking":0}');
            if (typeof progress === 'number') {
                progress = { listening: 0, reading: 0, writing: progress, speaking: 0 };
            }
            if (!progress.writing) progress.writing = 0;
            const completedIds = Object.keys(testScores);
            progress.writing = Math.max(progress.writing, completedIds.length);
            localStorage.setItem('testProgress', JSON.stringify(progress));

            console.log('[TestTracker] Saved writing completion to localStorage:', testId, config.score);
        } catch (e) {
            console.warn('[TestTracker] Failed to save to localStorage:', e);
        }
    }

    console.log('[TestTracker] Test tracking module loaded');

    // ═══════════════════════════════════════════════════════════════
    // GLOBAL OVERRIDES — writing test success modal & submit tracking
    // ═══════════════════════════════════════════════════════════════

    function applyGlobalOverrides() {
        // 1. Override success-modal close behaviour on writing test pages
        if (typeof window.closeSuccessMessage === 'function') {
            const originalCloseSuccessMessage = window.closeSuccessMessage;
            window.closeSuccessMessage = function() {
                if (originalCloseSuccessMessage) originalCloseSuccessMessage();
                window.location.href = '/dashboard.html';
            };
            window.closeSuccessMessageAndGoToDashboard = window.closeSuccessMessage;
            console.log('[TestTracker] Overrode closeSuccessMessage → redirect to /dashboard.html');
        }

        // 2. Update the button text inside the success modal dynamically
        const successModal = document.getElementById('successMessage');
        if (successModal) {
            const closeBtn = successModal.querySelector('button.btn');
            if (closeBtn && (closeBtn.textContent.trim() === 'Close' || closeBtn.textContent.includes('Close'))) {
                closeBtn.textContent = 'Close and Go back to Dashboard';
                const currentOnclick = closeBtn.getAttribute('onclick');
                if (currentOnclick && currentOnclick.includes('closeSuccessMessage')) {
                    closeBtn.setAttribute('onclick', 'closeSuccessMessageAndGoToDashboard()');
                }
                console.log('[TestTracker] Updated success modal button → "Close and Go back to Dashboard"');
            }
        }

        // 3. Wrap performSubmit so it also triggers the page's saveTestCompletion()
        if (typeof window.performSubmit === 'function' && !window.performSubmit._wrapped) {
            const originalPerformSubmit = window.performSubmit;
            window.performSubmit = function() {
                // Call the original submission logic first
                const result = originalPerformSubmit.apply(this, arguments);
                
                // Trigger AI evaluation if available (for timer auto-submit)
                if (window.aiWritingChecker && typeof window.aiWritingChecker.evaluateEssay === 'function') {
                    const textarea = document.getElementById('writingTextarea');
                    if (textarea && textarea.value.trim().split(/\s+/).length >= 50) {
                        console.log('[TestTracker] Auto-triggering AI evaluation for timer submit');
                        window.aiWritingChecker.evaluateEssay(textarea.value.trim());
                    }
                }
                
                // Fire-and-forget the tracking call if the page defined one
                if (typeof window.saveTestCompletion === 'function') {
                    try {
                        window.saveTestCompletion();
                        console.log('[TestTracker] saveTestCompletion() fired from wrapped performSubmit');
                    } catch (e) {
                        console.warn('[TestTracker] saveTestCompletion() failed:', e);
                    }
                }
                return result;
            };
            window.performSubmit._wrapped = true;
            console.log('[TestTracker] Wrapped performSubmit → auto-calls saveTestCompletion + AI evaluation');
        }
    }

    // Apply overrides immediately (script is at page bottom, DOM is ready)
    applyGlobalOverrides();
})();
