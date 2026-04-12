/**
 * Student Dashboard - Profile, Typing Dojo, Leaderboard
 */
const SAMPLE_TEXT = 'The IELTS academic test assesses your ability to use English in an academic environment. It includes tasks that reflect both study and work situations.';

async function loadProfile() {
  if (typeof apiFetch !== 'function') return;
  try {
    const res = await apiFetch('/api/user/profile');
    if (!res.ok) return;
    const data = await res.json();
    const topbar = document.getElementById('app-topbar');
    if (topbar) {
      const subtitle = topbar.querySelector('p');
      if (subtitle && data.full_name) {
        const country = data.country ? ` • ${data.country}` : '';
        subtitle.textContent = `${data.full_name}${country}`;
      }
    }
  } catch (_) {}
}

async function loadLeaderboard() {
  const container = document.getElementById('leaderboard-container');
  if (!container || typeof apiFetch !== 'function') return;
  try {
    const res = await apiFetch('/api/typing/leaderboard');
    if (!res.ok) {
      container.innerHTML = '<div class="empty-state">No leaderboard data yet.</div>';
      return;
    }
    const data = await res.json();
    const list = data.leaderboard || [];
    const top5 = list.slice(0, 5);
    if (top5.length === 0) {
      container.innerHTML = '<div class="empty-state">No scores yet. Complete a typing test to appear!</div>';
      return;
    }
    container.innerHTML = top5
      .map((entry, i) => {
        const name = entry.full_name || 'Anonymous';
        const wpm = Number(entry.best_wpm || 0).toFixed(0);
        const acc = entry.avg_accuracy ? Number(entry.avg_accuracy).toFixed(1) : '—';
        return `<div class="list-row"><span class="rank">#${i + 1}</span><span class="name">${name}</span><span class="wpm">${wpm} WPM</span><span class="acc">${acc}%</span></div>`;
      })
      .join('');
  } catch (_) {
    container.innerHTML = '<div class="empty-state">Failed to load leaderboard.</div>';
  }
}

function initTypingDojo() {
  const textarea = document.getElementById('typing-input');
  const hint = document.getElementById('typing-hint');
  const startBtn = document.getElementById('typing-start');
  const wpmDisplay = document.getElementById('typing-wpm');
  const accDisplay = document.getElementById('typing-acc');
  if (!textarea || typeof apiFetch !== 'function') return;

  let startTime = null;
  let originalText = SAMPLE_TEXT;

  function startTest() {
    textarea.value = '';
    textarea.disabled = false;
    textarea.focus();
    startTime = Date.now();
    if (hint) hint.textContent = 'Type the text above. Press Enter when done.';
    if (startBtn) startBtn.style.display = 'none';
  }

  function finishTest() {
    if (!startTime) return;
    const typed = textarea.value.trim();
    const elapsed = (Date.now() - startTime) / 60000; // minutes
    if (elapsed < 0.0001) return;
    const words = typed.split(/\s+/).filter(Boolean).length;
    const wpm = Math.round(words / elapsed);
    const expected = originalText.split(/\s+/).filter(Boolean).length;
    const accuracy = expected > 0 ? Math.min(100, Math.round((typed.length / originalText.length) * 100)) : 0;

    if (wpmDisplay) wpmDisplay.textContent = wpm;
    if (accDisplay) accDisplay.textContent = accuracy + '%';

    apiFetch('/api/typing/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wpm, accuracy }),
    })
      .then((r) => r.json())
      .then(() => {
        if (hint) hint.textContent = 'Score saved! Start again to improve.';
        loadLeaderboard();
      })
      .catch(() => {});

    textarea.disabled = true;
    if (startBtn) {
      startBtn.style.display = 'inline-block';
      startBtn.textContent = 'Try again';
    }
  }

  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && startTime) {
      e.preventDefault();
      finishTest();
    }
  });

  if (startBtn) {
    startBtn.addEventListener('click', startTest);
  }
}

async function loadData() {
  // Update target band from onboarding if set
  const userTargetBand = localStorage.getItem('userTargetBand');
  if (userTargetBand) {
    const targetBandElement = document.getElementById('targetBand');
    if (targetBandElement) {
      targetBandElement.textContent = userTargetBand;
    }
  }

  const ids = ['stat-wpm', 'stat-streak', 'stat-mocks', 'stat-band'];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = '—';
  });

  const upcoming = document.getElementById('upcoming-mocks');
  if (upcoming) upcoming.textContent = 'No upcoming mocks yet.';

  await loadProfile();
  await loadLeaderboard();
  initTypingDojo();
}

document.addEventListener('DOMContentLoaded', loadData);
