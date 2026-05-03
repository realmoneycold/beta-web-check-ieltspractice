// AI Speaking Review - injected for All-Parts-Set1.html
(function() {
    'use strict';

    function getAuthToken() {
        return localStorage.getItem('authToken') || localStorage.getItem('token') || localStorage.getItem('ielts_token') || '';
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function getCurrentQuestionText(part) {
        let text = '';
        if (part === 'p1') {
            const activeBlock = document.querySelector('#card-part-1 .question-block.active');
            if (activeBlock) {
                const heading = activeBlock.querySelector('.p1-topic-heading');
                const question = activeBlock.querySelector('.p1-question');
                const followups = activeBlock.querySelectorAll('.p1-followups li');
                text = (heading ? heading.textContent + '\n' : '') + (question ? question.textContent : '');
                if (followups.length) text += '\nFollow-ups: ' + Array.from(followups).map(li => li.textContent).join('; ');
            }
        } else if (part === 'p2') {
            const prompt = document.getElementById('p2-prompt');
            if (prompt) text = prompt.innerText;
        } else if (part === 'p3') {
            const activeBlock = document.querySelector('#card-part-3 .question-block.active');
            if (activeBlock) {
                const tag = activeBlock.querySelector('.p3-theme-tag');
                const question = activeBlock.querySelector('.p3-question');
                text = (tag ? tag.textContent + '\n' : '') + (question ? question.textContent : '');
            }
        }
        return text;
    }

    window.submitSpeakingReview = async function(part) {
        const textarea = document.getElementById('ai-text-' + part);
        const btn = document.getElementById('ai-btn-' + part);
        const resultsPanel = document.getElementById('ai-results-' + part);
        const text = textarea ? textarea.value.trim() : '';

        if (!text || text.length < 20) {
            alert('Please write at least 20 characters before submitting for AI review.');
            return;
        }

        const token = getAuthToken();
        if (!token) {
            alert('You need to be logged in to use AI review.');
            return;
        }

        btn.disabled = true;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="ai-loading"></span> Analyzing...';
        resultsPanel.classList.remove('visible');
        resultsPanel.innerHTML = '';

        const partTypeMap = { p1: 'Part1', p2: 'Part2', p3: 'Part3' };
        const questionPrompt = getCurrentQuestionText(part);

        try {
            const res = await fetch('/api/ai/assess-speaking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                body: JSON.stringify({ speakingText: text, partType: partTypeMap[part] || 'Full', questionPrompt: questionPrompt })
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'AI review failed');
            displaySpeakingResults(resultsPanel, data.assessment);
        } catch (err) {
            console.error('AI review error:', err);
            resultsPanel.innerHTML = '<p style="color:#e53935;font-size:13px;font-weight:600;">&#9888; ' + (err.message || 'Error. Try again.') + '</p>';
            resultsPanel.classList.add('visible');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    };

    function displaySpeakingResults(panel, a) {
        const f = a.fluencyAndCoherence || {};
        const l = a.lexicalResource || {};
        const g = a.grammaticalRangeAndAccuracy || {};
        const p = a.pronunciation || {};
        const overall = a.overallBandRounded || a.overallScore || 'N/A';

        let html = '<div class="ai-overall-row"><span class="ai-overall-label">Overall Band</span><span class="ai-overall-score">' + overall + '</span></div>';
        html += '<div class="ai-band-row"><span class="ai-criteria-name">Fluency & Coherence</span><span class="ai-band-badge">' + (f.score || f.band || 'N/A') + '</span></div>';
        html += '<div class="ai-band-row"><span class="ai-criteria-name">Lexical Resource</span><span class="ai-band-badge">' + (l.score || l.band || 'N/A') + '</span></div>';
        html += '<div class="ai-band-row"><span class="ai-criteria-name">Grammar</span><span class="ai-band-badge">' + (g.score || g.band || 'N/A') + '</span></div>';
        html += '<div class="ai-band-row"><span class="ai-criteria-name">Pronunciation</span><span class="ai-band-badge">' + (p.score || p.band || 'N/A') + '</span></div>';

        if (a.examinerNotes) {
            html += '<div class="ai-feedback-section"><div class="ai-feedback-heading">Examiner Notes</div><div class="ai-feedback-text">' + escapeHtml(a.examinerNotes) + '</div></div>';
        }
        if (a.strengths && a.strengths.length) {
            html += '<div class="ai-feedback-section"><div class="ai-feedback-heading">Strengths</div><div class="ai-feedback-text">' + a.strengths.map(function(s) { return '&#9989; ' + escapeHtml(s); }).join('<br>') + '</div></div>';
        }
        if (a.weaknesses && a.weaknesses.length) {
            html += '<div class="ai-feedback-section"><div class="ai-feedback-heading">Areas to Improve</div><div class="ai-feedback-text">' + a.weaknesses.map(function(w) { return '&#9888; ' + escapeHtml(w); }).join('<br>') + '</div></div>';
        }
        if (a.improvements && a.improvements.length) {
            html += '<div class="ai-feedback-section"><div class="ai-feedback-heading">Suggestions</div><div class="ai-feedback-text">' + a.improvements.map(function(i) { return '&#128161; ' + escapeHtml(i); }).join('<br>') + '</div></div>';
        }
        if (p.wordsToPractice && p.wordsToPractice.length) {
            html += '<div class="ai-feedback-section"><div class="ai-feedback-heading">Words to Practice</div><div class="ai-feedback-text">' + p.wordsToPractice.map(function(w) { return escapeHtml(w); }).join(', ') + '</div></div>';
        }

        panel.innerHTML = html;
        panel.classList.add('visible');
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // ═══════════════════════════════════════════════════════════
    // TEST RESULTS MODAL
    // ═══════════════════════════════════════════════════════════
    window.showTestResults = function() {
        const overlay = document.getElementById('resultsOverlay');
        const body = document.getElementById('resultsBody');
        const overallScoreEl = document.getElementById('resultsOverallScore');

        const partData = [
            { key: 'p1', title: 'Part 1 — Introduction & Interview' },
            { key: 'p2', title: 'Part 2 — Individual Long Turn' },
            { key: 'p3', title: 'Part 3 — Two-way Discussion' }
        ];

        let html = '';
        let totalBand = 0;
        let bandCount = 0;

        partData.forEach(function(part) {
            const textEl = document.getElementById('ai-text-' + part.key);
            const answer = textEl ? textEl.value.trim() : '';

            // Extract AI band score from the results panel if available
            const resultsPanel = document.getElementById('ai-results-' + part.key);
            let band = null;
            if (resultsPanel) {
                const overallEl = resultsPanel.querySelector('.ai-overall-score');
                if (overallEl) {
                    const bandVal = parseFloat(overallEl.textContent);
                    if (!isNaN(bandVal)) {
                        band = bandVal;
                        totalBand += bandVal;
                        bandCount++;
                    }
                }
            }

            html += '<div class="results-part-block">';
            html += '<div class="results-part-title">' + part.title + '</div>';
            if (answer) {
                html += '<div class="results-answer-text">' + escapeHtml(answer) + '</div>';
                if (band !== null) {
                    html += '<div class="results-ai-band">AI Band: ' + band + '</div>';
                }
            } else {
                html += '<div class="results-empty">No answer provided for this part.</div>';
            }
            html += '</div>';
        });

        // Update overall score if we have any bands
        let overallBand = '—';
        if (bandCount > 0) {
            overallBand = (totalBand / bandCount).toFixed(1);
            overallScoreEl.textContent = overallBand;
        } else {
            overallScoreEl.textContent = '—';
        }

        body.innerHTML = html;
        overlay.classList.add('visible');

        // Save test results to localStorage & backend
        saveSpeakingTestResults(overallBand, totalBand, bandCount);
    };

    function saveSpeakingTestResults(overallBand, totalBand, bandCount) {
        // Determine test set from URL
        const pathParts = window.location.pathname.split('/');
        const fileName = pathParts[pathParts.length - 1];
        const setMatch = fileName.match(/All-Parts-Set(\d+)/);
        const setNumber = setMatch ? setMatch[1] : '1';
        const testId = 'S_AP_' + String(setNumber).padStart(2, '0');

        // Build result object
        const result = {
            testId: testId,
            setNumber: setNumber,
            overallBand: overallBand,
            bandCount: bandCount,
            completedAt: new Date().toISOString(),
            skill: 'speaking'
        };

        // Save to localStorage
        let testScores = JSON.parse(localStorage.getItem('speaking_test_scores') || '{}');
        testScores[testId] = result;
        localStorage.setItem('speaking_test_scores', JSON.stringify(testScores));

        // Update speaking score in localStorage
        if (overallBand !== '—') {
            localStorage.setItem('speakingScore', overallBand);
        }

        // Update test progress count
        let progress = JSON.parse(localStorage.getItem('testProgress') || '{"listening":0,"reading":0,"writing":0,"speaking":0}');
        if (typeof progress === 'number') {
            progress = { listening: 0, reading: 0, writing: 0, speaking: progress };
        }
        if (!progress.speaking) progress.speaking = 0;
        const completedIds = Object.keys(testScores);
        progress.speaking = Math.max(progress.speaking, completedIds.length);
        localStorage.setItem('testProgress', JSON.stringify(progress));

        // Save to backend if user is logged in
        const token = getAuthToken();
        if (token && overallBand !== '—') {
            fetch('/api/statistics/attempt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({
                    testType: 'SPEAKING',
                    testId: testId,
                    testName: 'Speaking Test - Set ' + setNumber,
                    skillArea: 'SPEAKING',
                    score: parseFloat(overallBand),
                    maxScore: 9.0,
                    status: 'COMPLETED',
                    feedback: 'Overall Band: ' + overallBand
                })
            }).then(function(res) { return res.json(); })
              .then(function(data) { console.log('Test attempt saved:', data); })
              .catch(function(err) { console.warn('Failed to save test attempt:', err); });
        }
    }

    window.closeResults = function() {
        document.getElementById('resultsOverlay').classList.remove('visible');
    };

    window.goToDashboard = function() {
        window.location.href = '/dashboard.html';
    };

    // Close modal on backdrop click
    document.addEventListener('click', function(e) {
        const overlay = document.getElementById('resultsOverlay');
        if (overlay && e.target === overlay) {
            closeResults();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const overlay = document.getElementById('resultsOverlay');
            if (overlay && overlay.classList.contains('visible')) {
                closeResults();
            }
        }
    });
})();
