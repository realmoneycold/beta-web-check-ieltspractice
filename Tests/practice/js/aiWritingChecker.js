/**
 * AI Writing Checker Module
 * Evaluates IELTS writing samples using AI and displays detailed feedback
 * Compatible with all IELTS writing test pages
 */

console.log('[AI Checker] Script file starting to load...');

(function() {
    'use strict';

    console.log('[AI Checker] IIFE executing...');

    // Configuration
    const API_ENDPOINT = '/api/ai/assess-writing';
    const MIN_WORD_COUNT = 50;
    
    // State
    let isChecking = false;
    let currentEssay = '';
    let currentTaskType = 'Task2'; // Default to Task 2, can be overridden
    let originalSubmitHandler = null;  // Store original submit function

    /**
     * Initialize the AI Writing Checker
     * @param {Object} options - Configuration options
     * @param {string} options.textareaId - ID of the essay textarea
     * @param {string} options.submitButtonId - ID of the submit button
     * @param {string} options.taskType - 'Task1' or 'Task2'
     */
    function init(options = {}) {
        const config = {
            textareaId: 'writingTextarea',
            submitButtonId: 'deliver-button',
            taskType: 'Task2',
            ...options
        };

        currentTaskType = config.taskType;

        // Find elements
        const textarea = document.getElementById(config.textareaId);
        const submitBtn = document.getElementById(config.submitButtonId);

        if (!textarea || !submitBtn) {
            console.warn('AI Writing Checker: Required elements not found');
            return;
        }

        // Store reference to original submit handler for later
        // Use setTimeout to ensure page scripts have loaded
        setTimeout(() => {
            originalSubmitHandler = window.handleSubmitClick || window.performSubmit;
            console.log('[AI Checker] Stored original handler:', originalSubmitHandler ? 'found' : 'not found');
        }, 100);
        
        // Override submit button
        submitBtn.onclick = async function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const essay = textarea.value.trim();
            const wordCount = essay.split(/\s+/).filter(w => w.length > 0).length;

            if (wordCount < MIN_WORD_COUNT) {
                showNotification(`Please write at least ${MIN_WORD_COUNT} words. Current: ${wordCount} words.`, 'warning');
                return;
            }

            // Confirm submission
            const confirmed = confirm(`Submit your essay for AI evaluation?\n\nWord count: ${wordCount} words\nTask: ${currentTaskType}`);
            if (!confirmed) return;

            currentEssay = essay;
            await evaluateEssay(essay);
        };

        // Add AI check styles
        addStyles();
        
        console.log('✅ AI Writing Checker initialized');
    }

    /**
     * Send essay to AI for evaluation
     */
    async function evaluateEssay(essay) {
        if (isChecking) return;
        
        isChecking = true;
        showLoadingModal();

        try {
            const token = getAuthToken();
            
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    writing: essay,
                    taskType: currentTaskType
                })
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Please log in to use AI writing evaluation');
                }
                throw new Error(`Server error: ${response.status}`);
            }

            const result = await response.json();

            if (result.success && result.assessment) {
                const assessment = result.assessment.assessment || result.assessment;
                const savePromise = saveWritingTestScore(assessment);
                const hasBackendSave = !!savePromise;
                showResultsModal(assessment, hasBackendSave);
                // Wait for backend save so user can't navigate away before it's sent
                if (savePromise) {
                    savePromise.then(function() {
                        const btn = document.querySelector('#ai-checker-results .btn-primary');
                        if (btn) {
                            btn.textContent = 'Close and Go back to Dashboard';
                            btn.disabled = false;
                        }
                    }).catch(function() {
                        const btn = document.querySelector('#ai-checker-results .btn-primary');
                        if (btn) {
                            btn.textContent = 'Close and Go back to Dashboard';
                            btn.disabled = false;
                        }
                    });
                }
            } else {
                throw new Error(result.error || 'Evaluation failed');
            }
        } catch (error) {
            console.error('AI Writing Check Error:', error);
            showNotification(error.message || 'Failed to evaluate essay. Please try again.', 'error');
            hideLoadingModal();
        } finally {
            isChecking = false;
        }
    }

    /**
     * Show loading modal while AI evaluates
     */
    function showLoadingModal() {
        const modal = document.createElement('div');
        modal.id = 'ai-checker-loading';
        modal.innerHTML = `
            <div class="ai-checker-overlay">
                <div class="ai-checker-modal ai-checker-loading">
                    <div class="ai-checker-spinner"></div>
                    <h3>AI is evaluating your essay...</h3>
                    <p>This may take 10-20 seconds</p>
                    <div class="ai-checker-progress">
                        <div class="ai-checker-progress-bar"></div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Animate progress bar
        setTimeout(() => {
            const bar = modal.querySelector('.ai-checker-progress-bar');
            if (bar) bar.style.width = '100%';
        }, 100);
    }

    /**
     * Hide loading modal
     */
    function hideLoadingModal() {
        const modal = document.getElementById('ai-checker-loading');
        if (modal) modal.remove();
    }

    /**
     * Show AI evaluation results
     */
    function showResultsModal(assessment, hasBackendSave) {
        hideLoadingModal();

        const {
            overallBand,
            overallBandRounded,
            taskFulfillment,
            coherenceAndCohesion,
            lexicalRange,
            grammaticalAccuracy,
            strengths,
            weaknesses,
            improvements,
            estimatedScore
        } = assessment;

        const closeBtnText = hasBackendSave ? 'Saving score...' : 'Close and Go back to Dashboard';
        const closeBtnDisabled = hasBackendSave ? 'disabled' : '';

        const modal = document.createElement('div');
        modal.id = 'ai-checker-results';
        modal.innerHTML = `
            <div class="ai-checker-overlay" onclick="if(event.target===this)window.aiWritingChecker.closeResults()">
                <div class="ai-checker-modal ai-checker-results">
                    <button class="ai-checker-close" onclick="window.aiWritingChecker.closeResults()">&times;</button>
                    
                    <!-- Header -->
                    <div class="ai-checker-header">
                        <h2>🎯 AI Writing Evaluation</h2>
                        <div class="ai-checker-overall-band">
                            <span class="band-label">Overall Band</span>
                            <span class="band-score">${overallBandRounded || overallBand || 'N/A'}</span>
                        </div>
                    </div>

                    <!-- Criteria Scores -->
                    <div class="ai-checker-criteria">
                        <div class="criteria-item">
                            <div class="criteria-header">
                                <span class="criteria-name">Task Fulfillment</span>
                                <span class="criteria-band">${taskFulfillment?.score || taskFulfillment?.band || 'N/A'}</span>
                            </div>
                            <div class="criteria-bar">
                                <div class="criteria-fill" style="width: ${(taskFulfillment?.band || 0) * 11.1}%"></div>
                            </div>
                            <p class="criteria-feedback">${taskFulfillment?.feedback || 'No feedback available'}</p>
                        </div>

                        <div class="criteria-item">
                            <div class="criteria-header">
                                <span class="criteria-name">Coherence & Cohesion</span>
                                <span class="criteria-band">${coherenceAndCohesion?.score || coherenceAndCohesion?.band || 'N/A'}</span>
                            </div>
                            <div class="criteria-bar">
                                <div class="criteria-fill" style="width: ${(coherenceAndCohesion?.band || 0) * 11.1}%"></div>
                            </div>
                            <p class="criteria-feedback">${coherenceAndCohesion?.feedback || 'No feedback available'}</p>
                        </div>

                        <div class="criteria-item">
                            <div class="criteria-header">
                                <span class="criteria-name">Lexical Range</span>
                                <span class="criteria-band">${lexicalRange?.score || lexicalRange?.band || 'N/A'}</span>
                            </div>
                            <div class="criteria-bar">
                                <div class="criteria-fill" style="width: ${(lexicalRange?.band || 0) * 11.1}%"></div>
                            </div>
                            <p class="criteria-feedback">${lexicalRange?.feedback || 'No feedback available'}</p>
                        </div>

                        <div class="criteria-item">
                            <div class="criteria-header">
                                <span class="criteria-name">Grammatical Accuracy</span>
                                <span class="criteria-band">${grammaticalAccuracy?.score || grammaticalAccuracy?.band || 'N/A'}</span>
                            </div>
                            <div class="criteria-bar">
                                <div class="criteria-fill" style="width: ${(grammaticalAccuracy?.band || 0) * 11.1}%"></div>
                            </div>
                            <p class="criteria-feedback">${grammaticalAccuracy?.feedback || 'No feedback available'}</p>
                        </div>
                    </div>

                    <!-- Strengths & Weaknesses -->
                    <div class="ai-checker-analysis">
                        <div class="analysis-section strengths">
                            <h4>💪 Strengths</h4>
                            <ul>
                                ${(strengths || []).map(s => `<li>${s}</li>`).join('') || '<li>No specific strengths identified</li>'}
                            </ul>
                        </div>
                        <div class="analysis-section weaknesses">
                            <h4>🎯 Areas to Improve</h4>
                            <ul>
                                ${(weaknesses || []).map(w => `<li>${w}</li>`).join('') || '<li>No specific weaknesses identified</li>'}
                            </ul>
                        </div>
                    </div>

                    <!-- Improvement Suggestions -->
                    <div class="ai-checker-improvements">
                        <h4>📚 Recommended Improvements</h4>
                        <ul>
                            ${(improvements || []).map(i => `<li>${i}</li>`).join('') || '<li>No specific recommendations</li>'}
                        </ul>
                    </div>

                    <!-- Estimated Score -->
                    ${estimatedScore ? `
                    <div class="ai-checker-estimate">
                        <span>Estimated Score Range: <strong>${estimatedScore}</strong></span>
                    </div>
                    ` : ''}

                    <!-- Actions -->
                    <div class="ai-checker-actions">
                        <button class="btn-primary" id="aiCheckerCloseBtn" onclick="window.aiWritingChecker.closeAndGoToDashboard()" ${closeBtnDisabled}>${closeBtnText}</button>
                        <button class="btn-secondary" onclick="window.aiWritingChecker.retry()">Re-evaluate</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Animate criteria bars
        setTimeout(() => {
            modal.querySelectorAll('.criteria-fill').forEach(bar => {
                bar.style.width = bar.style.width;
            });
        }, 100);
    }

    /**
     * Close results modal
     */
    function closeResults() {
        const modal = document.getElementById('ai-checker-results');
        if (modal) modal.remove();
    }

    /**
     * Close results and submit the test
     */
    function closeResultsAndSubmit() {
        closeResults();
        // Call original submission handler
        if (typeof originalSubmitHandler === 'function') {
            originalSubmitHandler();
        } else if (window.performSubmit) {
            window.performSubmit();
        } else if (window.handleSubmitClick) {
            window.handleSubmitClick();
        }
    }

    // Track the pending backend save promise so we can wait before navigating
    let pendingSavePromise = null;

    /**
     * Close results and navigate to dashboard
     */
    function closeAndGoToDashboard() {
        closeResults();
        // If a backend save is still in flight, give it a moment to finish
        if (pendingSavePromise) {
            Promise.race([pendingSavePromise, new Promise(function(r) { setTimeout(r, 5000); })])
                .finally(function() {
                    window.location.href = '/dashboard.html';
                });
        } else {
            window.location.href = '/dashboard.html';
        }
    }

    /**
     * Close success message modal and navigate to dashboard
     * (shared function used by all writing test success modals)
     */
    window.closeSuccessMessageAndGoToDashboard = function() {
        const overlay = document.getElementById('overlay');
        const successMsg = document.getElementById('successMessage');
        if (overlay) overlay.style.display = 'none';
        if (successMsg) successMsg.style.display = 'none';
        window.location.href = '/dashboard.html';
    };

    /**
     * Unified token helper — checks every key the app uses
     */
    function getAuthToken() {
        return localStorage.getItem('authToken') ||
               localStorage.getItem('token') ||
               localStorage.getItem('ielts_token') ||
               localStorage.getItem('student_token') ||
               sessionStorage.getItem('authToken') ||
               sessionStorage.getItem('token') ||
               sessionStorage.getItem('ielts_token') ||
               sessionStorage.getItem('student_token') ||
               null;
    }

    /**
     * Save writing test score to localStorage and backend
     */
    function saveWritingTestScore(assessment) {
        const overallBand = assessment.overallBandRounded || assessment.overallBand || assessment.band || null;
        if (!overallBand) return;

        // Determine test info from URL
        const path = window.location.pathname;
        const decodedPath = decodeURIComponent(path);
        const fileName = path.substring(path.lastIndexOf('/') + 1);
        let testId = null;
        let testName = null;

        console.log('[AI Writing Checker] Saving score for path:', decodedPath, 'file:', fileName);

        // All Tasks full tests: All-Tasks-SetN.html -> W_AT_NN
        const allTasksMatch = fileName.match(/All-Tasks-Set(\d+)/);
        if (allTasksMatch) {
            const setNum = parseInt(allTasksMatch[1], 10);
            testId = 'W_AT_' + String(setNum).padStart(2, '0');
            testName = 'Writing Full Test - Set ' + setNum;
        }

        // Task 1: SetN.html in specific folders -> W_T1_FOLDER_NN
        const task1Match = fileName.match(/Set(\d+)/);
        if (!testId && task1Match) {
            const setNum = parseInt(task1Match[1], 10);
            if (decodedPath.includes('Graph') || decodedPath.includes('Chart') || decodedPath.includes('Table')) {
                testId = 'W_T1_GRAPH_' + String(setNum).padStart(2, '0');
                testName = 'Task 1 Graph/Chart/Table - Set ' + setNum;
            } else if (decodedPath.includes('Process') || decodedPath.includes('Diagram')) {
                testId = 'W_T1_PROC_' + String(setNum).padStart(2, '0');
                testName = 'Task 1 Process/Diagram - Set ' + setNum;
            } else if (decodedPath.includes('Map')) {
                testId = 'W_T1_MAP_' + String(setNum).padStart(2, '0');
                testName = 'Task 1 Map - Set ' + setNum;
            }
        }

        // Task 2: Writing-Part2-SetN.html -> W_T2_TYPE_NN
        const task2Match = fileName.match(/Writing-Part2-Set(\d+)/);
        if (!testId && task2Match) {
            const setNum = parseInt(task2Match[1], 10);
            if (decodedPath.includes('Opinion')) {
                testId = 'W_T2_OPINION_' + String(setNum).padStart(2, '0');
                testName = 'Task 2 Opinion Essay - Set ' + setNum;
            } else if (decodedPath.includes('Discussion')) {
                testId = 'W_T2_DISCUSSION_' + String(setNum).padStart(2, '0');
                testName = 'Task 2 Discussion Essay - Set ' + setNum;
            } else if (decodedPath.includes('Problem') || decodedPath.includes('Solution')) {
                testId = 'W_T2_PROBLEM_' + String(setNum).padStart(2, '0');
                testName = 'Task 2 Problem/Solution - Set ' + setNum;
            } else if (decodedPath.includes('Advantages')) {
                testId = 'W_T2_ADV_' + String(setNum).padStart(2, '0');
                testName = 'Task 2 Advantages/Disadvantages - Set ' + setNum;
            } else if (decodedPath.includes('Direct')) {
                testId = 'W_T2_DIRECT_' + String(setNum).padStart(2, '0');
                testName = 'Task 2 Direct Questions - Set ' + setNum;
            }
        }

        if (!testId) {
            // Fallback generic ID
            testId = 'W_' + fileName.replace(/[^a-zA-Z0-9]/g, '_');
            testName = 'Writing Test';
        }

        // Build result object
        const result = {
            testId: testId,
            testName: testName,
            overallBand: overallBand.toString(),
            taskType: currentTaskType,
            completedAt: new Date().toISOString(),
            skill: 'writing'
        };

        // Save to localStorage FIRST so dashboard always has it even if API fails
        let testScores = JSON.parse(localStorage.getItem('writing_test_scores') || '{}');
        testScores[testId] = result;
        localStorage.setItem('writing_test_scores', JSON.stringify(testScores));
        console.log('[AI Writing Checker] Saved to localStorage:', testId, result);

        // Update writing score in localStorage
        localStorage.setItem('writingScore', overallBand.toString());

        // Update test progress count
        let progress = JSON.parse(localStorage.getItem('testProgress') || '{"listening":0,"reading":0,"writing":0,"speaking":0}');
        if (typeof progress === 'number') {
            progress = { listening: 0, reading: 0, writing: progress, speaking: 0 };
        }
        if (!progress.writing) progress.writing = 0;
        const completedIds = Object.keys(testScores);
        progress.writing = Math.max(progress.writing, completedIds.length);
        localStorage.setItem('testProgress', JSON.stringify(progress));

        // Save to backend if user is logged in
        const token = getAuthToken();
        if (token) {
            pendingSavePromise = fetch('/api/statistics/attempt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                keepalive: true,
                body: JSON.stringify({
                    testType: 'WRITING',
                    testId: testId,
                    testName: testName,
                    skillArea: currentTaskType,
                    score: parseFloat(overallBand),
                    maxScore: 9.0,
                    status: 'COMPLETED',
                    feedback: 'Overall Band: ' + overallBand
                })
            }).then(function(res) { return res.json(); })
              .then(function(data) { console.log('Writing test attempt saved:', data); })
              .catch(function(err) { console.warn('Failed to save writing test attempt:', err); })
              .finally(function() { pendingSavePromise = null; });
        }

        return pendingSavePromise;
    }

    /**
     * Retry evaluation with current essay
     */
    function retry() {
        closeResults();
        if (currentEssay) {
            evaluateEssay(currentEssay);
        }
    }

    /**
     * Show notification toast
     */
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `ai-checker-notification ${type}`;
        notification.innerHTML = `
            <span class="notification-icon">${type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
            <span class="notification-message">${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    /**
     * Add required CSS styles
     */
    function addStyles() {
        if (document.getElementById('ai-checker-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'ai-checker-styles';
        styles.textContent = `
            /* AI Writing Checker Styles */
            .ai-checker-overlay {
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(4px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                padding: 20px;
            }

            .ai-checker-modal {
                background: white;
                border-radius: 16px;
                max-width: 700px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                position: relative;
            }

            .ai-checker-loading {
                text-align: center;
                padding: 40px;
            }

            .ai-checker-spinner {
                width: 50px;
                height: 50px;
                border: 4px solid #f3f4f6;
                border-top-color: #8B5CF6;
                border-radius: 50%;
                animation: ai-spinner 1s linear infinite;
                margin: 0 auto 20px;
            }

            @keyframes ai-spinner {
                to { transform: rotate(360deg); }
            }

            .ai-checker-progress {
                width: 200px;
                height: 4px;
                background: #e5e7eb;
                border-radius: 2px;
                margin: 20px auto 0;
                overflow: hidden;
            }

            .ai-checker-progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #8B5CF6, #FF6B35);
                width: 0%;
                transition: width 8s ease-out;
            }

            .ai-checker-close {
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                font-size: 28px;
                color: #9ca3af;
                cursor: pointer;
                z-index: 10;
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s;
            }

            .ai-checker-close:hover {
                background: #f3f4f6;
                color: #374151;
            }

            .ai-checker-header {
                background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
                color: white;
                padding: 30px;
                text-align: center;
                position: relative;
            }

            .ai-checker-header h2 {
                margin: 0 0 15px 0;
                font-size: 24px;
                font-weight: 700;
            }

            .ai-checker-overall-band {
                display: inline-flex;
                flex-direction: column;
                align-items: center;
                background: rgba(255, 255, 255, 0.2);
                backdrop-filter: blur(10px);
                padding: 15px 30px;
                border-radius: 12px;
            }

            .band-label {
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 1px;
                opacity: 0.9;
            }

            .band-score {
                font-size: 42px;
                font-weight: 800;
                line-height: 1;
            }

            .ai-checker-criteria {
                padding: 25px 30px;
                border-bottom: 1px solid #e5e7eb;
            }

            .criteria-item {
                margin-bottom: 20px;
            }

            .criteria-item:last-child {
                margin-bottom: 0;
            }

            .criteria-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }

            .criteria-name {
                font-weight: 600;
                color: #374151;
                font-size: 14px;
            }

            .criteria-band {
                font-weight: 700;
                color: #8B5CF6;
                font-size: 16px;
            }

            .criteria-bar {
                height: 8px;
                background: #e5e7eb;
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 8px;
            }

            .criteria-fill {
                height: 100%;
                background: linear-gradient(90deg, #8B5CF6, #FF6B35);
                border-radius: 4px;
                transition: width 0.8s ease-out;
                width: 0%;
            }

            .criteria-feedback {
                font-size: 13px;
                color: #6b7280;
                margin: 0;
                font-style: italic;
            }

            .ai-checker-analysis {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                padding: 25px 30px;
                border-bottom: 1px solid #e5e7eb;
            }

            @media (max-width: 600px) {
                .ai-checker-analysis {
                    grid-template-columns: 1fr;
                }
            }

            .analysis-section h4 {
                margin: 0 0 12px 0;
                font-size: 14px;
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .analysis-section.strengths h4 {
                color: #059669;
            }

            .analysis-section.weaknesses h4 {
                color: #dc2626;
            }

            .analysis-section ul {
                margin: 0;
                padding-left: 18px;
            }

            .analysis-section li {
                font-size: 13px;
                color: #4b5563;
                margin-bottom: 6px;
                line-height: 1.5;
            }

            .ai-checker-improvements {
                padding: 25px 30px;
                background: #f9fafb;
            }

            .ai-checker-improvements h4 {
                margin: 0 0 12px 0;
                font-size: 14px;
                font-weight: 700;
                color: #8B5CF6;
            }

            .ai-checker-improvements ul {
                margin: 0;
                padding-left: 18px;
            }

            .ai-checker-improvements li {
                font-size: 13px;
                color: #4b5563;
                margin-bottom: 8px;
                line-height: 1.5;
            }

            .ai-checker-estimate {
                padding: 15px 30px;
                text-align: center;
                background: #f3f4f6;
                font-size: 14px;
                color: #6b7280;
            }

            .ai-checker-estimate strong {
                color: #8B5CF6;
                font-weight: 700;
            }

            .ai-checker-actions {
                display: flex;
                gap: 12px;
                padding: 20px 30px;
                justify-content: center;
            }

            .btn-primary, .btn-secondary {
                padding: 12px 24px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s;
                border: none;
            }

            .btn-primary {
                background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
                color: white;
            }

            .btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
            }

            .btn-secondary {
                background: #f3f4f6;
                color: #4b5563;
            }

            .btn-secondary:hover {
                background: #e5e7eb;
            }

            /* Notification Toast */
            .ai-checker-notification {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: white;
                padding: 16px 20px;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
                display: flex;
                align-items: center;
                gap: 12px;
                z-index: 10001;
                transform: translateX(150%);
                transition: transform 0.3s ease-out;
                max-width: 400px;
            }

            .ai-checker-notification.show {
                transform: translateX(0);
            }

            .ai-checker-notification.error {
                border-left: 4px solid #dc2626;
            }

            .ai-checker-notification.warning {
                border-left: 4px solid #f59e0b;
            }

            .ai-checker-notification.info {
                border-left: 4px solid #8B5CF6;
            }

            .notification-icon {
                font-size: 20px;
            }

            .notification-message {
                font-size: 14px;
                color: #374151;
            }
        `;
        
        document.head.appendChild(styles);
    }

    // Expose public API
    window.aiWritingChecker = {
        init,
        closeResults,
        closeResultsAndSubmit,
        closeAndGoToDashboard,
        retry,
        evaluateEssay
    };

    console.log('📝 AI Writing Checker Module Loaded');
})();
