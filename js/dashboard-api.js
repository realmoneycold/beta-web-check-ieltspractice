/**
 * Dashboard API Integration Layer
 * Handles all API calls for the student dashboard
 */

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const API_BASE = '/api';

// Get auth token from localStorage
function getAuthToken() {
  return localStorage.getItem('authToken') || localStorage.getItem('token');
}

// Get user role from localStorage
function getUserRole() {
  return localStorage.getItem('role') || 'STUDENT';
}

// Default headers for API requests
function getHeaders() {
  const headers = {
    'Content-Type': 'application/json',
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

// Handle API response
async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));

    // Handle 401 - redirect to login
    if (response.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('token');
      window.location.href = '/login.html';
      throw new Error('Session expired. Please login again.');
    }

    throw new Error(error.error || error.message || 'Request failed');
  }

  return response.json();
}

// Generic API request
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const config = {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    return await handleResponse(response);
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD DATA ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * Get comprehensive dashboard data
 * @returns {Promise<Object>} Full dashboard data
 */
async function getFullDashboardData() {
  return apiRequest('/student/dashboard/full', {
    method: 'GET',
  });
}

/**
 * Get quick dashboard statistics
 * @returns {Promise<Object>} Statistics summary
 */
async function getDashboardStats() {
  return apiRequest('/student/dashboard/stats', {
    method: 'GET',
  });
}

// ═══════════════════════════════════════════════════════════════
// PROFILE ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * Get user profile
 * @returns {Promise<Object>} User profile data
 */
async function getProfile() {
  return apiRequest('/student/profile', {
    method: 'GET',
  });
}

/**
 * Update user profile
 * @param {Object} data - Profile data to update
 * @returns {Promise<Object>} Updated profile
 */
async function updateProfile(data) {
  return apiRequest('/student/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Update password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Success response
 */
async function updatePassword(currentPassword, newPassword) {
  return apiRequest('/student/profile/password', {
    method: 'PATCH',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

/**
 * Complete onboarding
 * @param {Object} data - Onboarding data
 * @returns {Promise<Object>} Updated user data
 */
async function completeOnboarding(data) {
  return apiRequest('/student/onboarding', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ═══════════════════════════════════════════════════════════════
// TYPING PRACTICE ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * Get typing history
 * @param {Object} params - Query params (page, limit, from, to)
 * @returns {Promise<Object>} Typing history and stats
 */
async function getTypingHistory(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(`/student/typing${queryString ? '?' + queryString : ''}`, {
    method: 'GET',
  });
}

/**
 * Save typing result
 * @param {number} wpm - Words per minute
 * @param {number} accuracy - Accuracy percentage
 * @param {number} durationMinutes - Duration in minutes
 * @returns {Promise<Object>} Saved result
 */
async function saveTypingResult(wpm, accuracy, durationMinutes = 2) {
  return apiRequest('/student/typing', {
    method: 'POST',
    body: JSON.stringify({ wpm, accuracy, durationMinutes }),
  });
}

// ═══════════════════════════════════════════════════════════════
// STUDY STREAK ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * Get study streak info
 * @returns {Promise<Object>} Streak data
 */
async function getStudyStreak() {
  return apiRequest('/student/streak', {
    method: 'GET',
  });
}

/**
 * Mark today's study as complete
 * @returns {Promise<Object>} Updated streak
 */
async function markStudyComplete() {
  return apiRequest('/student/streak', {
    method: 'POST',
  });
}

// ═══════════════════════════════════════════════════════════════
// WEEKLY PROGRESS ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * Get weekly progress history
 * @returns {Promise<Object>} Weekly progress data
 */
async function getWeeklyProgress() {
  return apiRequest('/student/weekly-progress', {
    method: 'GET',
  });
}

/**
 * Update weekly progress
 * @param {number} perfectScoresCount - Number of perfect scores
 * @param {number} progressPercentage - Progress percentage
 * @returns {Promise<Object>} Updated progress
 */
async function updateWeeklyProgress(perfectScoresCount, progressPercentage) {
  return apiRequest('/student/weekly-progress', {
    method: 'PUT',
    body: JSON.stringify({ perfectScoresCount, progressPercentage }),
  });
}

// ═══════════════════════════════════════════════════════════════
// MOCK TEST ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * Get mock test results
 * @param {Object} params - Query params (page, limit)
 * @returns {Promise<Object>} Mock results
 */
async function getMockResults(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(`/student/mock-results${queryString ? '?' + queryString : ''}`, {
    method: 'GET',
  });
}

/**
 * Save mock test result
 * @param {Object} data - Result data
 * @returns {Promise<Object>} Saved result
 */
async function saveMockResult(data) {
  return apiRequest('/student/mock-results', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Get upcoming mock sessions
 * @param {Object} params - Query params (city, limit)
 * @returns {Promise<Object>} Mock sessions
 */
async function getMockSessions(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(`/student/mock-sessions${queryString ? '?' + queryString : ''}`, {
    method: 'GET',
  });
}

// ═══════════════════════════════════════════════════════════════
// PRACTICE TEST ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * Get listening practice tests
 * @param {Object} params - Query params (part, set)
 * @returns {Promise<Object>} Practice tests
 */
async function getListeningPractice(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(`/student/practice/listening${queryString ? '?' + queryString : ''}`, {
    method: 'GET',
  });
}

/**
 * Get reading practice tests
 * @param {Object} params - Query params (part, set)
 * @returns {Promise<Object>} Practice tests
 */
async function getReadingPractice(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(`/student/practice/reading${queryString ? '?' + queryString : ''}`, {
    method: 'GET',
  });
}

/**
 * Save practice test result
 * @param {Object} data - Result data
 * @returns {Promise<Object>} Saved result
 */
async function saveTestResult(data) {
  return apiRequest('/student/test-results', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Get practice test results
 * @param {Object} params - Query params (category, subcategory)
 * @returns {Promise<Object>} Test results
 */
async function getTestResults(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(`/student/test-results${queryString ? '?' + queryString : ''}`, {
    method: 'GET',
  });
}

/**
 * Get test unlocks
 * @param {Object} params - Query params (category)
 * @returns {Promise<Object>} Test unlocks
 */
async function getTestUnlocks(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(`/student/test-unlocks${queryString ? '?' + queryString : ''}`, {
    method: 'GET',
  });
}

/**
 * Check if a level is unlocked
 * @param {string} category - Test category
 * @param {string} subcategory - Test subcategory
 * @param {number} setNumber - Set number
 * @returns {Promise<Object>} Unlock status
 */
async function checkLevelUnlock(category, subcategory, setNumber) {
  return apiRequest(`/student/test-unlocks/check/${category}/${subcategory || ''}/${setNumber}`, {
    method: 'GET',
  });
}

/**
 * Get progress snapshot
 * @returns {Promise<Object>} Progress snapshot
 */
async function getProgressSnapshot() {
  return apiRequest('/student/progress-snapshot', {
    method: 'GET',
  });
}

/**
 * Create/update progress snapshot
 * @param {Object} data - Snapshot data
 * @returns {Promise<Object>} Updated snapshot
 */
async function createProgressSnapshot(data) {
  return apiRequest('/student/progress-snapshot', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Get AI progress analysis
 * @returns {Promise<Object>} AI analysis
 */
async function getAIProgressAnalysis() {
  return apiRequest('/student/progress/ai-analysis', {
    method: 'GET',
  });
}

// ═══════════════════════════════════════════════════════════════
// LEADERBOARD ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * Get leaderboard
 * @param {Object} params - Query params (limit, scope)
 * @returns {Promise<Object>} Leaderboard data
 */
async function getLeaderboard(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(`/student/leaderboard${queryString ? '?' + queryString : ''}`, {
    method: 'GET',
  });
}

// ═══════════════════════════════════════════════════════════════
// CENTRES ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * Get education centres
 * @param {Object} params - Query params (city, type, search)
 * @returns {Promise<Object>} Centres data
 */
async function getCentres(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(`/student/centres${queryString ? '?' + queryString : ''}`, {
    method: 'GET',
  });
}

/**
 * Get single centre by ID
 * @param {number} id - Centre ID
 * @returns {Promise<Object>} Centre data
 */
async function getCentreById(id) {
  return apiRequest(`/student/centres/${id}`, {
    method: 'GET',
  });
}

/**
 * Submit inquiry to a centre
 * @param {Object} data - Inquiry data (centreId, studentName, studentEmail, message)
 * @returns {Promise<Object>} Submitted inquiry
 */
async function submitCentreInquiry(data) {
  return apiRequest('/student/centres/inquiry', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ═══════════════════════════════════════════════════════════════
// AI CHAT ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * Get AI chat history
 * @param {Object} params - Query params (page, limit)
 * @returns {Promise<Object>} Chat history
 */
async function getAiChats(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(`/student/ai-chats${queryString ? '?' + queryString : ''}`, {
    method: 'GET',
  });
}

/**
 * Create AI chat session
 * @param {Object} data - Chat data (topic)
 * @returns {Promise<Object>} Created chat
 */
async function createAiChat(data) {
  return apiRequest('/student/ai-chats', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update AI chat session
 * @param {number} id - Chat ID
 * @param {Object} data - Update data
 * @returns {Promise<Object>} Updated chat
 */
async function updateAiChat(id, data) {
  return apiRequest(`/student/ai-chats/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete AI chat session
 * @param {number} id - Chat ID
 * @returns {Promise<Object>} Success response
 */
async function deleteAiChat(id) {
  return apiRequest(`/student/ai-chats/${id}`, {
    method: 'DELETE',
  });
}

// ═══════════════════════════════════════════════════════════════
// STUDY GROUP ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * Get study group applications
 * @returns {Promise<Object>} Applications
 */
async function getApplications() {
  return apiRequest('/student/applications', {
    method: 'GET',
  });
}

/**
 * Apply to a study group
 * @param {number} groupId - Group ID
 * @returns {Promise<Object>} Created application
 */
async function createApplication(groupId) {
  return apiRequest('/student/applications', {
    method: 'POST',
    body: JSON.stringify({ groupId }),
  });
}

/**
 * Delete/withdraw application
 * @param {number} id - Application ID
 * @returns {Promise<Object>} Success response
 */
async function deleteApplication(id) {
  return apiRequest(`/student/applications/${id}`, {
    method: 'DELETE',
  });
}

// ═══════════════════════════════════════════════════════════════
// REPORTS ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * Get submitted reports
 * @returns {Promise<Object>} Reports
 */
async function getReports() {
  return apiRequest('/student/reports', {
    method: 'GET',
  });
}

/**
 * Submit a report
 * @param {Object} data - Report data (testId, questionId?, type, description)
 * @returns {Promise<Object>} Submitted report
 */
async function createReport(data) {
  return apiRequest('/student/reports', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ═══════════════════════════════════════════════════════════════
// EXPORT API
// ═══════════════════════════════════════════════════════════════

window.DashboardAPI = {
  // Config
  getAuthToken,
  getUserRole,

  // Dashboard
  getFullDashboardData,
  getDashboardStats,

  // Profile
  getProfile,
  updateProfile,
  updatePassword,
  completeOnboarding,

  // Typing
  getTypingHistory,
  saveTypingResult,

  // Streak
  getStudyStreak,
  markStudyComplete,

  // Weekly Progress
  getWeeklyProgress,
  updateWeeklyProgress,

  // Mock Tests
  getMockResults,
  saveMockResult,
  getMockSessions,

  // Practice Tests
  getListeningPractice,
  getReadingPractice,
  saveTestResult,
  getTestResults,
  getTestUnlocks,
  checkLevelUnlock,
  getProgressSnapshot,
  createProgressSnapshot,
  getAIProgressAnalysis,

  // Leaderboard
  getLeaderboard,

  // Centres
  getCentres,
  getCentreById,
  submitCentreInquiry,

  // AI Chat
  getAiChats,
  createAiChat,
  updateAiChat,
  deleteAiChat,

  // Study Groups
  getApplications,
  createApplication,
  deleteApplication,

  // Reports
  getReports,
  createReport,
};

// ═══════════════════════════════════════════════════════════════
// DASHBOARD INITIALIZATION HELPER
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize dashboard with data from API
 * Call this when dashboard view is loaded
 */
async function initializeDashboard() {
  try {
    console.log('Initializing dashboard...');

    // Show loading state
    const loadingEl = document.getElementById('dashboard-loading');
    if (loadingEl) loadingEl.style.display = 'flex';

    // Fetch all dashboard data
    const dashboardData = await getFullDashboardData();

    console.log('Dashboard data loaded:', dashboardData);

    // Hide loading
    if (loadingEl) loadingEl.style.display = 'none';

    return dashboardData;
  } catch (error) {
    console.error('Failed to initialize dashboard:', error);

    // Show error state
    const errorEl = document.getElementById('dashboard-error');
    if (errorEl) {
      errorEl.style.display = 'flex';
      errorEl.textContent = error.message;
    }

    throw error;
  }
}

// Export initialization helper
window.initializeDashboard = initializeDashboard;

// Auto-initialize if on dashboard page
if (window.location.pathname.includes('dashboard.html') || window.location.pathname === '/dashboard') {
  document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated
    const token = getAuthToken();
    if (!token) {
      console.warn('No auth token found, redirecting to login...');
      window.location.href = '/login.html';
      return;
    }

    // Initialize dashboard
    initializeDashboard().catch(console.error);
  });
}

console.log('Dashboard API loaded successfully');
