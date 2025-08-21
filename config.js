// config.js - FINAL VERSION
const config = {
    API_BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' // For local testing
        : 'https://rbu-defense-technology-3rd-sem.onrender.com', // Your LIVE backend URL
        /*: 'https://your-netlify-site-name.netlify.app',*/
            

    endpoints: {
        attendance: '/api/attendance',
        sessionStatus: '/api/session-status',
        faculty: {
            login: '/api/faculty/login',
            sessions: '/api/faculty/sessions',
            activeSession: '/api/faculty/sessions/active',
            endSession: '/api/faculty/sessions/{id}/end', // Using {id} as a placeholder
            students: '/api/faculty/students',
            rooms: '/api/faculty/rooms',
            attendanceSummary: '/api/faculty/attendance-summary'
        }
    }
};

function getApiUrl(endpoint, params = {}) {
    let url = config.API_BASE_URL + endpoint;
    for (const key in params) {
        url = url.replace(`{${key}}`, params[key]);
    }
    return url;
}

window.CONFIG = config;
window.getApiUrl = getApiUrl;
