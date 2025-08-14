// config.js - Add this new file to handle environment-specific URLs
const config = {
    API_BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:3000/api' 
        : 'https://rbu-defense-technoogy-3rd-sem-attendance-system-production.up.railway.app/api',
    // Automatically detect if we're in development or production
    // Alternative approach - you can also use environment detection
    isDevelopment: window.location.hostname === 'localhost',
    
    // API endpoints
    endpoints: {
        attendance: '/attendance',
        sessionStatus: '/session-status',
        faculty: {
            login: '/faculty/login',
            sessions: '/faculty/sessions',
            students: '/faculty/students',
            rooms: '/faculty/rooms',
            attendanceSummary: '/faculty/attendance-summary'
        }
    }
};

// Helper function to build full API URLs
function getApiUrl(endpoint) {
    return config.API_BASE_URL + endpoint;
}

// Export for use in other files
window.CONFIG = config;
window.getApiUrl = getApiUrl;
