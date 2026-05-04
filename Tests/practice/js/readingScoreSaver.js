/**
 * Reading Score Saver
 * Intercepts calculateBand() in reading test files to save scores to DB + localStorage
 */
(function() {
    'use strict';

    // ── Detect test info from URL ──────────────────────────────────────────
    const path = window.location.pathname;
    const filename = path.split('/').pop().replace('.html', '');
    const parts = path.split('/');

    // testId: Reading-Part1-Set1
    const testId = filename;

    // testName: Reading Part 1 - Set 1
    const testName = filename.replace(/-/g, ' ');

    // skillArea based on directory
    let skillArea = 'READING';
    if (path.includes('Reading-Part1')) skillArea = 'READING_PART1';
    else if (path.includes('Reading-Part2')) skillArea = 'READING_PART2';
    else if (path.includes('Reading-Part3')) skillArea = 'READING_PART3';
    else if (path.includes('All-Passages')) skillArea = 'READING_ALL_PASSAGES';

    const testInfo = { testId, testName, skillArea };
    console.log('[ReadingScoreSaver] Detected test:', testInfo);

    // ── Intercept calculateBand ────────────────────────────────────────────
    function patchCalculateBand() {
        if (typeof window.calculateBand !== 'function') {
            console.warn('[ReadingScoreSaver] calculateBand not found yet, retrying...');
            return false;
        }
        if (window.calculateBand._readingPatched) {
            console.log('[ReadingScoreSaver] Already patched');
            return true;
        }

        const original = window.calculateBand;
        window.calculateBand = function(score) {
            const band = original(score);

            // Get total questions from global
            const totalQuestions = window.TOTAL_Q || 13;

            // ── Save to localStorage ───────────────────────────────────────
            try {
                const existing = JSON.parse(localStorage.getItem('reading_test_scores') || '[]');
                const entry = {
                    testId: testInfo.testId,
                    testName: testInfo.testName,
                    skill: 'reading',
                    score: score,
                    maxScore: totalQuestions,
                    band: band,
                    completedAt: new Date().toISOString()
                };
                // Remove duplicate if exists
                const filtered = existing.filter(e => e.testId !== testInfo.testId);
                filtered.push(entry);
                localStorage.setItem('reading_test_scores', JSON.stringify(filtered));
                console.log('[ReadingScoreSaver] Saved to localStorage:', entry);
            } catch (e) {
                console.warn('[ReadingScoreSaver] localStorage save failed:', e);
            }

            // ── Save to backend ─────────────────────────────────────────────
            const token = localStorage.getItem('token')
                        || localStorage.getItem('authToken')
                        || localStorage.getItem('ielts_token')
                        || sessionStorage.getItem('token');

            if (token) {
                const payload = {
                    testType: 'READING',
                    testId: testInfo.testId,
                    testName: testInfo.testName,
                    skillArea: testInfo.skillArea,
                    score: score,
                    maxScore: totalQuestions,
                    status: 'COMPLETED',
                    feedback: 'Band: ' + band
                };

                fetch('/api/statistics/attempt', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    keepalive: true,
                    body: JSON.stringify(payload)
                })
                .then(function(res) {
                    if (res.status === 401) throw new Error('UNAUTHORIZED');
                    if (!res.ok) throw new Error('HTTP ' + res.status);
                    return res.json();
                })
                .then(function(data) {
                    console.log('[ReadingScoreSaver] Score saved to DB:', data);
                })
                .catch(function(err) {
                    if (err.message === 'UNAUTHORIZED') {
                        console.warn('[ReadingScoreSaver] Auth expired, keeping localStorage copy');
                    } else {
                        console.warn('[ReadingScoreSaver] DB save failed:', err.message);
                    }
                });
            } else {
                console.log('[ReadingScoreSaver] No auth token — score saved locally only');
            }

            return band;
        };
        window.calculateBand._readingPatched = true;
        console.log('[ReadingScoreSaver] calculateBand patched successfully');
        return true;
    }

    // Try immediately (if script loaded after main script block)
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        patchCalculateBand();
    }

    // Retry on DOM ready and periodically
    document.addEventListener('DOMContentLoaded', function() {
        patchCalculateBand();
    });

    let attempts = 0;
    const interval = setInterval(function() {
        if (patchCalculateBand()) {
            clearInterval(interval);
        }
        attempts++;
        if (attempts > 30) {
            clearInterval(interval);
            console.error('[ReadingScoreSaver] Failed to patch calculateBand after 30 attempts');
        }
    }, 500);
})();
