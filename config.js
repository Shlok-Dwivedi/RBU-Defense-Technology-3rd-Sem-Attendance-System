// config.js - CORRECTED VERSION
const config = {
    API_BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' // For local testing
        : 'https://rbu-defense-technology-3rd-sem.onrender.com', // Your LIVE backend URL

    // API endpoints (ensure all endpoints start with /api)
    endpoints: {
        attendance: '/api/attendance',
        sessionStatus: '/api/session-status',
        faculty: {
            login: '/api/faculty/login',
            sessions: '/api/faculty/sessions',
            activeSession: '/api/faculty/sessions/active', // The one that failed
            endSession: '/api/faculty/sessions/:id/end',
            students: '/api/faculty/students',
            rooms: '/api/faculty/rooms',
            attendanceSummary: '/api/faculty/attendance-summary'
        }
    }
};

// Helper function to build full API URLs
function getApiUrl(endpoint) {
    return config.API_BASE_URL + endpoint;
}

// Export for use in other files
window.CONFIG = config;
window.getApi-Url = getApiUrl;
