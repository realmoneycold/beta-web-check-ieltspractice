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

        let html = '';
        let totalBand = 0;
        let bandCount = 0;
        let evaluatedCount = 0;

        // Get AI results from localStorage if available
        let savedResults = {};
        try {
            savedResults = JSON.parse(localStorage.getItem('allparts_ai_results') || '{}');
        } catch(e) {}

        // Part 1 - show each question
        html += '<div class="results-section"><h3>Part 1 — Introduction & Interview</h3>';
        for (let i = 1; i <= (window.P1_TOTAL || 3); i++) {
            const answer = window.p1Answers && window.p1Answers[i] ? window.p1Answers[i] : '';
            const qBlock = document.getElementById('p1-q' + i);
            const questionText = qBlock ? (qBlock.querySelector('.p1-question')?.textContent || 'Question ' + i) : 'Question ' + i;
            
            // Check for saved AI result
            let band = null;
            if (savedResults.p1) {
                const result = savedResults.p1.find(r => r.qNum === i);
                if (result) band = result.band;
            }
            
            html += '<div class="results-question-block">';
            html += '<div class="results-question-title">Question ' + i + '</div>';
            if (answer && answer.trim()) {
                html += '<div class="results-answer-text">' + escapeHtml(answer.substring(0, 100) + (answer.length > 100 ? '...' : '')) + '</div>';
                if (band !== null) {
                    html += '<div class="results-ai-band">Band: ' + band + '</div>';
                    totalBand += band;
                    bandCount++;
                    evaluatedCount++;
                } else {
                    html += '<div class="results-ai-band" style="color:#999;">Not evaluated</div>';
                }
            } else {
                html += '<div class="results-empty">No answer provided</div>';
            }
            html += '</div>';
        }
        html += '</div>';

        // Part 2
        html += '<div class="results-section"><h3>Part 2 — Individual Long Turn</h3>';
        const p2Answer = document.getElementById('ai-text-p2') ? document.getElementById('ai-text-p2').value : '';
        let p2Band = null;
        if (savedResults.p2 && savedResults.p2[0]) p2Band = savedResults.p2[0].band;
        
        html += '<div class="results-question-block">';
        if (p2Answer && p2Answer.trim()) {
            html += '<div class="results-answer-text">' + escapeHtml(p2Answer.substring(0, 150) + (p2Answer.length > 150 ? '...' : '')) + '</div>';
            if (p2Band !== null) {
                html += '<div class="results-ai-band">Band: ' + p2Band + '</div>';
                totalBand += p2Band;
                bandCount++;
                evaluatedCount++;
            } else {
                html += '<div class="results-ai-band" style="color:#999;">Not evaluated</div>';
            }
        } else {
            html += '<div class="results-empty">No answer provided</div>';
        }
        html += '</div></div>';

        // Part 3 - show each question
        html += '<div class="results-section"><h3>Part 3 — Two-way Discussion</h3>';
        for (let i = 1; i <= (window.P3_TOTAL || 5); i++) {
            const answer = window.p3Answers && window.p3Answers[i] ? window.p3Answers[i] : '';
            
            let band = null;
            if (savedResults.p3) {
                const result = savedResults.p3.find(r => r.qNum === i);
                if (result) band = result.band;
            }
            
            html += '<div class="results-question-block">';
            html += '<div class="results-question-title">Question ' + i + '</div>';
            if (answer && answer.trim()) {
                html += '<div class="results-answer-text">' + escapeHtml(answer.substring(0, 100) + (answer.length > 100 ? '...' : '')) + '</div>';
                if (band !== null) {
                    html += '<div class="results-ai-band">Band: ' + band + '</div>';
                    totalBand += band;
                    bandCount++;
                    evaluatedCount++;
                } else {
                    html += '<div class="results-ai-band" style="color:#999;">Not evaluated</div>';
                }
            } else {
                html += '<div class="results-empty">No answer provided</div>';
            }
            html += '</div>';
        }
        html += '</div>';

        // Calculate overall band with IELTS rounding (0.5 increments)
        let overallBand = '—';
        if (bandCount > 0) {
            overallBand = (Math.round((totalBand / bandCount) * 2) / 2).toFixed(1);
            overallScoreEl.textContent = overallBand;
        } else {
            overallScoreEl.textContent = '—';
        }

        // Add summary at top
        let summaryText = '';
        if (bandCount > 0) {
            summaryText = '<div style="text-align:center;margin-bottom:20px;padding:15px;background:#f0fdf4;border-radius:8px;"><strong style="color:#10B981;font-size:18px;">' + evaluatedCount + ' answers evaluated</strong><br>Overall Band: <strong style="font-size:24px;color:#1a1a2e;">' + overallBand + '</strong><br>Based on ' + bandCount + ' scored answers</div>';
        } else {
            summaryText = '<div style="text-align:center;margin-bottom:20px;padding:15px;background:#fef2f2;border-radius:8px;color:#e53935;">No answers could be evaluated.<br>Please provide at least one answer.</div>';
        }

        // Add detailed feedback section if we have AI results
        let detailedFeedbackHtml = '';
        const allAiResults = [];
        
        // Collect all AI assessment objects
        ['p1', 'p2', 'p3'].forEach(function(partKey) {
            if (savedResults[partKey]) {
                savedResults[partKey].forEach(function(r) {
                    if (r.assessment) {
                        allAiResults.push({
                            part: partKey,
                            qNum: r.qNum,
                            assessment: r.assessment
                        });
                    }
                });
            }
        });

        if (allAiResults.length > 0) {
            detailedFeedbackHtml = '<div class="results-detailed-feedback" style="margin-top:30px;padding-top:20px;border-top:2px solid #e0e0e0;">';
            detailedFeedbackHtml += '<h3 style="font-size:18px;font-weight:700;color:#1a1a2e;margin-bottom:20px;">📊 Detailed Feedback & Analysis</h3>';
            
            allAiResults.forEach(function(item) {
                const a = item.assessment;
                const f = a.fluencyAndCoherence || {};
                const l = a.lexicalResource || {};
                const g = a.grammaticalRangeAndAccuracy || {};
                const p = a.pronunciation || {};
                
                const partName = item.part === 'p1' ? 'Part 1' : (item.part === 'p2' ? 'Part 2' : 'Part 3');
                
                detailedFeedbackHtml += '<div class="feedback-block" style="margin-bottom:25px;padding:15px;background:#f8f9fa;border-radius:8px;border-left:4px solid #8B5CF6;">';
                detailedFeedbackHtml += '<div style="font-weight:700;color:#1a1a2e;margin-bottom:10px;">' + partName + ' Question ' + item.qNum + ' — Band: ' + (a.overallBandRounded || a.overallScore || 'N/A') + '</div>';
                
                // Criteria breakdown
                detailedFeedbackHtml += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;font-size:13px;">';
                detailedFeedbackHtml += '<div><strong>Fluency:</strong> ' + (f.score || f.band || 'N/A') + '</div>';
                detailedFeedbackHtml += '<div><strong>Vocabulary:</strong> ' + (l.score || l.band || 'N/A') + '</div>';
                detailedFeedbackHtml += '<div><strong>Grammar:</strong> ' + (g.score || g.band || 'N/A') + '</div>';
                detailedFeedbackHtml += '<div><strong>Pronunciation:</strong> ' + (p.score || p.band || 'N/A') + '</div>';
                detailedFeedbackHtml += '</div>';
                
                // Examiner notes
                if (a.examinerNotes) {
                    detailedFeedbackHtml += '<div style="margin-bottom:10px;padding:10px;background:#fff;border-radius:6px;"><strong style="color:#8B5CF6;">Examiner Notes:</strong> ' + escapeHtml(a.examinerNotes) + '</div>';
                }
                
                // Strengths
                if (a.strengths && a.strengths.length) {
                    detailedFeedbackHtml += '<div style="margin-bottom:8px;"><strong style="color:#10B981;">✅ Strengths:</strong><ul style="margin:5px 0;padding-left:20px;">';
                    a.strengths.forEach(function(s) {
                        detailedFeedbackHtml += '<li>' + escapeHtml(s) + '</li>';
                    });
                    detailedFeedbackHtml += '</ul></div>';
                }
                
                // Weaknesses
                if (a.weaknesses && a.weaknesses.length) {
                    detailedFeedbackHtml += '<div style="margin-bottom:8px;"><strong style="color:#e53935;">⚠️ Areas to Improve:</strong><ul style="margin:5px 0;padding-left:20px;">';
                    a.weaknesses.forEach(function(w) {
                        detailedFeedbackHtml += '<li>' + escapeHtml(w) + '</li>';
                    });
                    detailedFeedbackHtml += '</ul></div>';
                }
                
                // Suggestions
                if (a.improvements && a.improvements.length) {
                    detailedFeedbackHtml += '<div><strong style="color:#f59e0b;">💡 Suggestions:</strong><ul style="margin:5px 0;padding-left:20px;">';
                    a.improvements.forEach(function(i) {
                        detailedFeedbackHtml += '<li>' + escapeHtml(i) + '</li>';
                    });
                    detailedFeedbackHtml += '</ul></div>';
                }
                
                // Words to practice
                if (p.wordsToPractice && p.wordsToPractice.length) {
                    detailedFeedbackHtml += '<div style="margin-top:8px;padding:8px;background:#fff3cd;border-radius:6px;"><strong style="color:#856404;">📝 Words to Practice:</strong> ' + p.wordsToPractice.map(function(w) { return '<span style="display:inline-block;margin:2px;padding:2px 6px;background:#ffc107;border-radius:3px;font-size:12px;">' + escapeHtml(w) + '</span>'; }).join(' ') + '</div>';
                }
                
                detailedFeedbackHtml += '</div>';
            });
            
            // Overall recommendations
            detailedFeedbackHtml += '<div style="margin-top:20px;padding:15px;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);border-radius:8px;color:#fff;">';
            detailedFeedbackHtml += '<h4 style="margin:0 0 10px 0;font-size:16px;">🎯 Overall Recommendations</h4>';
            detailedFeedbackHtml += '<p style="margin:0;font-size:14px;line-height:1.5;">Based on your performance across all parts, focus on the following areas to improve your IELTS Speaking score:</p>';
            detailedFeedbackHtml += '<ul style="margin:10px 0;padding-left:20px;font-size:13px;">';
            
            // Calculate average scores for each criterion
            let fTotal = 0, fCount = 0, lTotal = 0, lCount = 0, gTotal = 0, gCount = 0, pTotal = 0, pCount = 0;
            allAiResults.forEach(function(item) {
                const a = item.assessment;
                if (a.fluencyAndCoherence) { fTotal += parseFloat(a.fluencyAndCoherence.score || a.fluencyAndCoherence.band || 0); fCount++; }
                if (a.lexicalResource) { lTotal += parseFloat(a.lexicalResource.score || a.lexicalResource.band || 0); lCount++; }
                if (a.grammaticalRangeAndAccuracy) { gTotal += parseFloat(a.grammaticalRangeAndAccuracy.score || a.grammaticalRangeAndAccuracy.band || 0); gCount++; }
                if (a.pronunciation) { pTotal += parseFloat(a.pronunciation.score || a.pronunciation.band || 0); pCount++; }
            });
            
            const fAvg = fCount > 0 ? (fTotal / fCount).toFixed(1) : 0;
            const lAvg = lCount > 0 ? (lTotal / lCount).toFixed(1) : 0;
            const gAvg = gCount > 0 ? (gTotal / gCount).toFixed(1) : 0;
            const pAvg = pCount > 0 ? (pTotal / pCount).toFixed(1) : 0;
            
            // Find weakest area
            const scores = [
                { name: 'Fluency & Coherence', avg: fAvg },
                { name: 'Lexical Resource (Vocabulary)', avg: lAvg },
                { name: 'Grammatical Range & Accuracy', avg: gAvg },
                { name: 'Pronunciation', avg: pAvg }
            ];
            scores.sort(function(a, b) { return a.avg - b.avg; });
            
            detailedFeedbackHtml += '<li><strong>Focus Area:</strong> Your weakest area is <strong>' + scores[0].name + '</strong> (avg: ' + scores[0].avg + '). Spend extra time practicing this.</li>';
            detailedFeedbackHtml += '<li><strong>Practice Regularly:</strong> Record yourself answering IELTS questions and review your responses.</li>';
            detailedFeedbackHtml += '<li><strong>Expand Vocabulary:</strong> Learn topic-specific vocabulary for common IELTS themes (work, education, technology, environment).</li>';
            detailedFeedbackHtml += '<li><strong>Grammar Practice:</strong> Review complex sentence structures and tenses.</li>';
            detailedFeedbackHtml += '</ul>';
            detailedFeedbackHtml += '</div>';
            
            detailedFeedbackHtml += '</div>';
        }

        body.innerHTML = summaryText + html + detailedFeedbackHtml;
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

    window.finishAndGoToDashboard = function() {
        const overallScoreEl = document.getElementById('resultsOverallScore');
        const overallBand = overallScoreEl.textContent !== '—' ? overallScoreEl.textContent : null;
        
        // Save all answers to localStorage
        localStorage.setItem('allparts_p1_answers', JSON.stringify(window.p1Answers || {}));
        localStorage.setItem('allparts_p3_answers', JSON.stringify(window.p3Answers || {}));
        const p2Text = document.getElementById('ai-text-p2');
        if (p2Text) localStorage.setItem('allparts_p2_answer', p2Text.value);
        
        // Save final score
        if (overallBand && overallBand !== '—') {
            localStorage.setItem('speakingScore', overallBand);
        }
        
        // Redirect to dashboard
        window.location.href = '/dashboard.html';
    };

    // ═══════════════════════════════════════════════════════════
    // COMPREHENSIVE AI EVALUATION FOR ALL QUESTIONS
    // ═══════════════════════════════════════════════════════════
    window.evaluateAllAnswers = async function() {
        const overlay = document.getElementById('resultsOverlay');
        const body = document.getElementById('resultsBody');
        const overallScoreEl = document.getElementById('resultsOverallScore');

        overlay.classList.add('visible');
        body.innerHTML = '<div class="results-loading"><div class="results-loading-spinner"></div><p>Analyzing all your answers with AI...<br><small>This may take a moment</small></p></div>';
        overallScoreEl.textContent = '—';

        const token = getAuthToken();
        if (!token) {
            body.innerHTML = '<p style="color:#e53935;text-align:center;">You need to be logged in to use AI evaluation.</p>';
            return;
        }

        // Collect all questions and answers
        const questions = [];
        
        // Part 1 questions
        for (let i = 1; i <= (window.P1_TOTAL || 3); i++) {
            const qBlock = document.getElementById('p1-q' + i);
            if (qBlock) {
                const heading = qBlock.querySelector('.p1-topic-heading');
                const question = qBlock.querySelector('.p1-question');
                const answer = window.p1Answers && window.p1Answers[i] ? window.p1Answers[i] : '';
                questions.push({
                    part: 'Part 1',
                    num: i,
                    text: (heading ? heading.textContent + ': ' : '') + (question ? question.textContent : ''),
                    answer: answer,
                    partKey: 'p1'
                });
            }
        }
        
        // Part 2
        const p2Text = document.getElementById('ai-text-p2');
        const p2Prompt = document.getElementById('p2-prompt');
        if (p2Text && p2Prompt) {
            questions.push({
                part: 'Part 2',
                num: 1,
                text: 'Long Turn: ' + p2Prompt.textContent.substring(0, 100) + '...',
                answer: p2Text.value,
                partKey: 'p2'
            });
        }
        
        // Part 3 questions
        for (let i = 1; i <= (window.P3_TOTAL || 5); i++) {
            const qBlock = document.getElementById('p3-q' + i);
            if (qBlock) {
                const tag = qBlock.querySelector('.p3-theme-tag');
                const question = qBlock.querySelector('.p3-question');
                const answer = window.p3Answers && window.p3Answers[i] ? window.p3Answers[i] : '';
                questions.push({
                    part: 'Part 3',
                    num: i,
                    text: (tag ? tag.textContent + ': ' : '') + (question ? question.textContent : ''),
                    answer: answer,
                    partKey: 'p3'
                });
            }
        }

        let totalBand = 0;
        let bandCount = 0;
        let resultsHtml = '';
        let evaluatedCount = 0;
        const aiResults = {};

        // Evaluate each question that has an answer
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            
            if (!q.answer || q.answer.trim().length < 20) {
                resultsHtml += '<div class="results-part-block">';
                resultsHtml += '<div class="results-part-title">' + q.part + ' Question ' + q.num + '</div>';
                resultsHtml += '<div class="results-empty">No answer provided (or too short)</div>';
                resultsHtml += '</div>';
                continue;
            }

            // Update progress
            body.innerHTML = resultsHtml + '<div class="results-loading" style="margin-top:20px;"><div class="results-loading-spinner"></div><p>Evaluating ' + q.part + ' Question ' + q.num + '...<br><small>' + (evaluatedCount + 1) + ' of ' + questions.filter(q => q.answer && q.answer.trim().length >= 20).length + '</small></p></div>';

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000);

                const partTypeMap = { 'p1': 'Part1', 'p2': 'Part2', 'p3': 'Part3' };
                
                const res = await fetch('/api/ai/assess-speaking', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({
                        speakingText: q.answer,
                        partType: partTypeMap[q.partKey] || 'Full',
                        questionPrompt: q.text
                    }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                const data = await res.json();

                if (data.success && data.assessment) {
                    const a = data.assessment;
                    const band = parseFloat(a.overallBandRounded || a.overallScore || 0);
                    
                    if (!isNaN(band) && band > 0) {
                        totalBand += band;
                        bandCount++;
                        evaluatedCount++;
                        
                        // Store in aiResults
                        if (!aiResults[q.partKey]) aiResults[q.partKey] = [];
                        aiResults[q.partKey].push({ qNum: q.num, band: band, assessment: a });
                    }

                    resultsHtml += '<div class="results-part-block">';
                    resultsHtml += '<div class="results-part-title">' + q.part + ' Question ' + q.num + '</div>';
                    resultsHtml += '<div class="results-answer-text">' + escapeHtml(q.answer.substring(0, 100) + (q.answer.length > 100 ? '...' : '')) + '</div>';
                    resultsHtml += '<div class="results-ai-band">Band: ' + band + '</div>';
                    resultsHtml += '</div>';
                } else {
                    resultsHtml += '<div class="results-part-block">';
                    resultsHtml += '<div class="results-part-title">' + q.part + ' Question ' + q.num + '</div>';
                    resultsHtml += '<div class="results-answer-text">' + escapeHtml(q.answer.substring(0, 100)) + '...</div>';
                    resultsHtml += '<div style="color:#e53935;">AI evaluation failed: ' + (data.error || 'Unknown error') + '</div>';
                    resultsHtml += '</div>';
                }
            } catch (err) {
                console.error('AI evaluation error for ' + q.part + ' Q' + q.num, err);
                let errorMsg = err.name === 'AbortError' ? 'Request timed out (30s)' : err.message;
                resultsHtml += '<div class="results-part-block">';
                resultsHtml += '<div class="results-part-title">' + q.part + ' Question ' + q.num + '</div>';
                resultsHtml += '<div class="results-answer-text">' + escapeHtml(q.answer.substring(0, 100)) + '...</div>';
                resultsHtml += '<div style="color:#e53935;">Error: ' + escapeHtml(errorMsg) + '</div>';
                resultsHtml += '</div>';
            }
        }

        // Calculate overall band
        let overallBand = '—';
        if (bandCount > 0) {
            overallBand = (Math.round((totalBand / bandCount) * 2) / 2).toFixed(1); // Round to 0.5
            overallScoreEl.textContent = overallBand;
        } else {
            overallScoreEl.textContent = '—';
        }

        // Add summary at top
        let summaryText = '';
        if (bandCount > 0) {
            summaryText = '<div style="text-align:center;margin:20px 0;padding:15px;background:#f0fdf4;border-radius:8px;"><strong style="color:#10B981;">' + evaluatedCount + ' answers evaluated</strong><br>Overall Band: ' + overallBand + '<br>Based on ' + bandCount + ' scored answers</div>';
        } else {
            summaryText = '<div style="text-align:center;margin:20px 0;padding:15px;background:#fef2f2;border-radius:8px;color:#e53935;">No answers could be evaluated.<br>Please provide at least one answer.</div>';
        }
        
        body.innerHTML = summaryText + resultsHtml;

        // Save results
        saveSpeakingTestResults(overallBand, totalBand, bandCount);
        
        // Store detailed AI results
        localStorage.setItem('allparts_ai_results', JSON.stringify(aiResults));
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
