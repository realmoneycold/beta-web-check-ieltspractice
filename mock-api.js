// Mock API System for Local Testing
// Intercepts fetch calls and returns mock data for dashboard functionality

(function() {
    'use strict';
    
    // Store original fetch
    const originalFetch = window.fetch;
    
    // Mock API responses
    const mockResponses = {
        '/api/student/dashboard-data': {
            success: true,
            data: {
                user: {
                    full_name: 'Test Student',
                    email: 'student@test.com',
                    target_band: 7.0,
                    current_band: 6.5,
                    tasks_done: 5,
                    weekly_goal_percent: 75
                },
                stats: {
                    total_practice_time: 120,
                    tests_completed: 8,
                    average_score: 6.2
                }
            }
        },
        '/api/student/onboarding': {
            success: true,
            message: 'Onboarding data saved'
        },
        '/api/community/weekly-stats': {
            students_joined: 45,
            community_avg_band: 6.8,
            active_users: 23
        },
        '/api/student/profile': {
            success: true,
            data: {
                full_name: 'Test Student',
                email: 'student@test.com',
                target_band: 7.0,
                current_band: 6.5,
                tasks_done: 5,
                weekly_goal_percent: 75
            }
        },
        '/api/user/profile': {
            full_name: 'Test Student',
            email: 'student@test.com',
            target_band: 7.0,
            current_band: 6.5,
            overall_band: 6.5,
            tasks_done: 5,
            tests_completed: 8,
            country: 'Uzbekistan',
            member_since: 'Mar 2024',
            study_hours: 24,
            best_streak: 5,
            weekly_goal_percent: 75
        },
        '/api/student/recent-activity': {
            success: true,
            data: [
                {
                    type: 'practice',
                    description: 'Completed Reading Test 1',
                    timestamp: new Date(Date.now() - 3600000).toISOString(),
                    score: 6.5
                },
                {
                    type: 'practice',
                    description: 'Completed Listening Test 2',
                    timestamp: new Date(Date.now() - 7200000).toISOString(),
                    score: 7.0
                }
            ]
        },
        '/api/users/search': {
            users: [
                {
                    id: 1,
                    full_name: 'John Doe',
                    email: 'john@test.com',
                    current_band: 7.5
                },
                {
                    id: 2,
                    full_name: 'Jane Smith',
                    email: 'jane@test.com',
                    current_band: 6.8
                }
            ]
        },
        '/api/exam-dates': {
            dates: [
                {
                    date: '2024-04-15',
                    type: 'Academic',
                    location: 'Tashkent'
                },
                {
                    date: '2024-04-20',
                    type: 'General',
                    location: 'Samarkand'
                }
            ]
        },
        '/api/user/study-streak': {
            entries: [
                { date: '2024-03-25', studied: true },
                { date: '2024-03-26', studied: true },
                { date: '2024-03-27', studied: true },
                { date: '2024-03-28', studied: true },
                { date: '2024-03-29', studied: true }
            ]
        },
        '/api/user/performance-history': {
            months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            scores: [5.5, 6.0, 6.2, 6.5, 6.8, 7.0]
        },
        '/api/user/practice-stats': {
            sessions_done: 15,
            study_hours: 24,
            study_streak: 5
        },
        '/api/user/next-exam': {
            exam_date: '2024-04-15',
            exam_type: 'Academic',
            days_remaining: 17
        },
        '/api/user/practice-progress': {
            reading: 65,
            writing: 70,
            speaking: 60,
            listening: 75,
            overall: 67
        },
        '/api/student/skill-progress': {
            success: true,
            data: {
                reading: { completed: 8, total: 12, score: 6.5 },
                writing: { completed: 6, total: 10, score: 6.8 },
                speaking: { completed: 4, total: 8, score: 6.2 },
                listening: { completed: 10, total: 15, score: 7.0 }
            }
        },
        '/api/typing/submit': {
            success: true,
            message: 'Typing result saved'
        },
        '/api/ielts/leaderboard': {
            success: true,
            data: [
                { id: 1, full_name: 'Alice Johnson', country: 'UK', overall_band: 8.5, target_band: 9.0, tasks_done: 25 },
                { id: 2, full_name: 'Bob Smith', country: 'USA', overall_band: 8.0, target_band: 8.5, tasks_done: 20 },
                { id: 3, full_name: 'Carol Davis', country: 'Canada', overall_band: 7.5, target_band: 8.0, tasks_done: 18 },
                { id: 4, full_name: 'David Wilson', country: 'Australia', overall_band: 7.0, target_band: 7.5, tasks_done: 15 },
                { id: 5, full_name: 'Eva Brown', country: 'New Zealand', overall_band: 6.5, target_band: 7.0, tasks_done: 12 }
            ]
        },
        '/api/typing/leaderboard': {
            success: true,
            data: [
                { id: 1, full_name: 'Fast Typist', wpm: 85, accuracy: 98, tests_taken: 50 },
                { id: 2, full_name: 'Speed Demon', wpm: 78, accuracy: 95, tests_taken: 45 },
                { id: 3, full_name: 'Quick Fingers', wpm: 72, accuracy: 92, tests_taken: 40 },
                { id: 4, full_name: 'Rapid Typer', wpm: 68, accuracy: 90, tests_taken: 35 },
                { id: 5, full_name: 'Swift Keys', wpm: 65, accuracy: 88, tests_taken: 30 }
            ]
        }
    };
    
    // Mock fetch function
    window.fetch = function(url, options = {}) {
        console.log('Mock API Call:', url, options);
        
        // Check if this is an API call we should mock
        if (mockResponses[url]) {
            return Promise.resolve({
                ok: true,
                status: 200,
                headers: {
                    get: function(name) {
                        if (name === 'content-type') return 'application/json';
                        return null;
                    }
                },
                json: () => Promise.resolve(mockResponses[url]),
                text: () => Promise.resolve(JSON.stringify(mockResponses[url]))
            });
        }
        
        // Handle user profile with ID
        if (url.startsWith('/api/users/') && url.endsWith('/profile')) {
            return Promise.resolve({
                ok: true,
                status: 200,
                headers: {
                    get: function(name) {
                        if (name === 'content-type') return 'application/json';
                        return null;
                    }
                },
                json: () => Promise.resolve({
                    full_name: 'Test User',
                    email: 'user@test.com',
                    current_band: 7.0,
                    target_band: 7.5,
                    tasks_done: 10
                }),
                text: () => Promise.resolve(JSON.stringify({
                    full_name: 'Test User',
                    email: 'user@test.com',
                    current_band: 7.0,
                    target_band: 7.5,
                    tasks_done: 10
                }))
            });
        }
        
        // Handle PUT requests to student profile
        if (url === '/api/student/profile' && options.method === 'PUT') {
            return Promise.resolve({
                ok: true,
                status: 200,
                headers: {
                    get: function(name) {
                        if (name === 'content-type') return 'application/json';
                        return null;
                    }
                },
                json: () => Promise.resolve({ success: true, message: 'Profile updated successfully' }),
                text: () => Promise.resolve(JSON.stringify({ success: true, message: 'Profile updated successfully' }))
            });
        }
        
        // Handle POST requests
        if (url === '/api/student/skill-progress' && options.method === 'POST') {
            return Promise.resolve({
                ok: true,
                status: 200,
                headers: {
                    get: function(name) {
                        if (name === 'content-type') return 'application/json';
                        return null;
                    }
                },
                json: () => Promise.resolve({ success: true, message: 'Skill progress updated' }),
                text: () => Promise.resolve(JSON.stringify({ success: true, message: 'Skill progress updated' }))
            });
        }
        
        if (url === '/api/user/practice-progress' && options.method === 'POST') {
            return Promise.resolve({
                ok: true,
                status: 200,
                headers: {
                    get: function(name) {
                        if (name === 'content-type') return 'application/json';
                        return null;
                    }
                },
                json: () => Promise.resolve({ success: true, message: 'Progress saved' }),
                text: () => Promise.resolve(JSON.stringify({ success: true, message: 'Progress saved' }))
            });
        }
        
        // For any other API calls, return a generic success response
        if (url.startsWith('/api/')) {
            return Promise.resolve({
                ok: true,
                status: 200,
                headers: {
                    get: function(name) {
                        if (name === 'content-type') return 'application/json';
                        return null;
                    }
                },
                json: () => Promise.resolve({ success: true, message: 'Mock response' }),
                text: () => Promise.resolve(JSON.stringify({ success: true, message: 'Mock response' }))
            });
        }
        
        // For non-API calls, use original fetch
        return originalFetch.apply(this, arguments);
    };
    
    console.log('Mock API system initialized for local testing');
})();
