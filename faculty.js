// Faculty Dashboard JavaScript - Complete Updated Version
console.log('🚀 Faculty dashboard JavaScript loaded');

// Global state management
let currentFacultyToken = null;
let activeSessions = []; // Changed from single session to array for multiple sessions
let allSessions = [];
let allStudents = [];
let attendanceSummary = [];
let availableRooms = [];

// DOM elements
const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');
const logoutBtn = document.getElementById('logout-btn');

// Modal elements
const sessionModal = document.getElementById('session-modal');
const sessionForm = document.getElementById('session-form');

// Tab elements
const tabLinks = document.querySelectorAll('.tab-link');
const tabContents = document.querySelectorAll('.tab-content');

// Table body elements
const sessionsTableBody = document.getElementById('sessions-table-body');
const summaryTableBody = document.getElementById('summary-table-body');
const studentsTableBody = document.getElementById('students-table-body');

// Filter elements
const roomFilter = document.getElementById('room-filter');
const dateFilter = document.getElementById('date-filter');
const clearDateBtn = document.getElementById('clear-date-btn');
const studentRoomFilter = document.getElementById('student-room-filter');

// Session form elements
const sessionNameInput = document.getElementById('session-name');
const sessionRoomSelect = document.getElementById('session-room');

// Active session elements
const activeSessionContainer = document.getElementById('active-session-container');
const startSessionBtn = document.getElementById('start-session-btn');

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('📋 Initializing faculty dashboard...');
    
    // Check if user is already logged in
    const savedToken = localStorage.getItem('faculty_token');
    if (savedToken) {
        currentFacultyToken = savedToken;
        showDashboard();
        loadDashboardData();
    } else {
        showLogin();
    }
    
    setupEventListeners();
});

// Event listeners setup
function setupEventListeners() {
    // Login form
    loginForm.addEventListener('submit', handleLogin);
    
    // Logout
    logoutBtn.addEventListener('click', handleLogout);
    
    // Session management
    startSessionBtn.addEventListener('click', openSessionModal);
    sessionForm.addEventListener('submit', handleStartSession);
    
    // Filters
    roomFilter.addEventListener('change', loadAttendanceSummary);
    dateFilter.addEventListener('change', loadAttendanceSummary);
    clearDateBtn.addEventListener('click', clearDateFilter);
    studentRoomFilter.addEventListener('change', loadStudentsData);
    
    // Modal close events
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
    
    // Periodic refresh for active session status
    setInterval(checkActiveSession, 10000); // Every 10 seconds
}

// Authentication functions
async function handleLogin(e) {
    e.preventDefault();
    console.log('🔐 Attempting faculty login...');
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showLoginMessage('Please fill in all fields.', 'error');
        return;
    }
    
    setLoginLoading(true);
    
    try {
        const response = await fetch(getApiUrl(window.CONFIG.endpoints.faculty.login), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
        
        if (result.success && result.token) {
            console.log('✅ Login successful');
            currentFacultyToken = result.token;
            localStorage.setItem('faculty_token', result.token);
            
            showLoginMessage('Login successful! Loading dashboard...', 'success');
            
            setTimeout(() => {
                showDashboard();
                loadDashboardData();
            }, 1000);
            
        } else {
            showLoginMessage(result.message || 'Login failed', 'error');
        }
        
    } catch (error) {
        console.error('💥 Login error:', error);
        showLoginMessage('Connection error. Please check if server is running.', 'error');
    } finally {
        setLoginLoading(false);
    }
}

function handleLogout() {
    console.log('👋 Logging out...');
    currentFacultyToken = null;
    localStorage.removeItem('faculty_token');
    showLogin();
    
    // Reset all data
    activeSessions = [];
    allSessions = [];
    allStudents = [];
    attendanceSummary = [];
    availableRooms = [];
}

// UI state management
function showLogin() {
    loginView.style.display = 'block';
    dashboardView.style.display = 'none';
    loginForm.reset();
    showLoginMessage('', '');
}

function showDashboard() {
    loginView.style.display = 'none';
    dashboardView.style.display = 'block';
}

function setLoginLoading(isLoading) {
    const submitBtn = loginForm.querySelector('.submit-button');
    
    submitBtn.disabled = isLoading;
    
    if (isLoading) {
        submitBtn.textContent = 'Logging in...';
    } else {
        submitBtn.textContent = 'Login';
    }
}

function showLoginMessage(message, type) {
    if (message) {
        loginMessage.textContent = message;
        loginMessage.className = `message ${type}`;
        loginMessage.style.display = 'block';
    } else {
        loginMessage.style.display = 'none';
    }
}

// Tab management
function showTab(tabId, clickedElement) {
    console.log('📋 Switching to tab:', tabId);
    
    // Update tab links
    tabLinks.forEach(link => link.classList.remove('active'));
    clickedElement.classList.add('active');
    
    // Update tab content
    tabContents.forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
    });
    
    const targetTab = document.getElementById(tabId);
    if (targetTab) {
        targetTab.classList.add('active');
        targetTab.style.display = 'block';
    }
    
    // Load data for specific tab
    switch(tabId) {
        case 'sessions-tab':
            loadSessionsData();
            break;
        case 'summary-tab':
            loadAttendanceSummary();
            break;
        case 'students-tab':
            loadStudentsData();
            break;
    }
}

// Data loading functions
async function loadDashboardData() {
    console.log('📊 Loading dashboard data...');
    
    try {
        // Load rooms first, then other data
        await loadRoomsData();
        await Promise.all([
            checkActiveSession(),
            loadSessionsData()
        ]);
        
        console.log('✅ Dashboard data loaded successfully');
    } catch (error) {
        console.error('💥 Error loading dashboard data:', error);
    }
}

async function loadRoomsData() {
    console.log('🏠 Loading rooms data from database...');
    
    try {
        const response = await fetch(getApiUrl(window.CONFIG.endpoints.faculty.rooms), {
            headers: { 'Authorization': `Bearer ${currentFacultyToken}` }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const rooms = await response.json();
        availableRooms = rooms;
        console.log('✅ Loaded rooms from database:', availableRooms);
        
        // Populate room filter dropdowns
        populateRoomFilters();
        
    } catch (error) {
        console.error('💥 Error loading rooms from database:', error);
        // If rooms can't be loaded from database, show empty state
        availableRooms = [];
        populateRoomFilters();
        
        // Show user-friendly message
        console.warn('⚠️ Could not load room data from database. Please check your connection.');
    }
}

function populateRoomFilters() {
    console.log('🏠 Populating room filters with dynamic data:', availableRooms);
    
    // Room filter configurations
    const roomFilterConfigs = [
        { 
            element: roomFilter, 
            keepAll: true, 
            allText: 'All Rooms',
            name: 'Attendance Summary Filter'
        },
        { 
            element: studentRoomFilter, 
            keepAll: true, 
            allText: 'All Rooms',
            name: 'Student Filter'
        },
        { 
            element: sessionRoomSelect, 
            keepAll: false, 
            allText: 'Select Room',
            name: 'Session Room Select'
        }
    ];
    
    roomFilterConfigs.forEach(({ element, keepAll, allText, name }) => {
        if (!element) {
            console.warn('⚠️ Element not found for:', name);
            return;
        }
        
        console.log('🏠 Populating:', name);
        
        // Clear all options
        element.innerHTML = '';
        
        // Add "All" or "Select" option for filter dropdowns
        if (keepAll || element === sessionRoomSelect) {
            const defaultOption = document.createElement('option');
            defaultOption.value = keepAll ? 'all' : '';
            defaultOption.textContent = allText;
            element.appendChild(defaultOption);
        }
        
        // Add room options from database
        if (availableRooms && availableRooms.length > 0) {
            availableRooms.forEach(room => {
                const option = document.createElement('option');
                option.value = room;
                option.textContent = `Room ${room}`;
                element.appendChild(option);
            });
            console.log('✅ Added', availableRooms.length, 'rooms to', name);
        } else {
            console.log('ℹ️ No rooms available for', name);
            
            // Show message in session modal if no rooms are available
            if (element === sessionRoomSelect) {
                const noRoomsOption = document.createElement('option');
                noRoomsOption.value = '';
                noRoomsOption.textContent = 'No rooms available';
                noRoomsOption.disabled = true;
                element.appendChild(noRoomsOption);
            }
        }
    });
}

// CORRECTED: Active sessions checking with proper endpoint
async function checkActiveSession() {
    console.log('🔍 Checking for active sessions...');
    
    try {
        // FIXED: Using the correct endpoint from config
        const response = await fetch(getApiUrl(window.CONFIG.endpoints.faculty.activeSession), {
            headers: { 'Authorization': `Bearer ${currentFacultyToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to check active sessions');
        
        const data = await response.json();
        // Handle both single session response and multiple sessions
        if (data.session) {
            // Single session response (backwards compatibility)
            activeSessions = [data.session];
        } else if (data.sessions) {
            // Multiple sessions response
            activeSessions = data.sessions;
        } else {
            activeSessions = [];
        }
        
        updateActiveSessionsDisplay();
        
    } catch (error) {
        console.error('💥 Error checking active sessions:', error);
        activeSessions = [];
        updateActiveSessionsDisplay();
    }
}

// Updated display for multiple active sessions
function updateActiveSessionsDisplay() {
    if (activeSessions.length > 0) {
        console.log(`✅ ${activeSessions.length} active session(s) found`);
        
        // Clear existing content
        activeSessionContainer.innerHTML = '';
        
        // Create header
        const headerDiv = document.createElement('div');
        headerDiv.className = 'active-sessions-header';
        headerDiv.innerHTML = `
            <h3>Active Sessions (${activeSessions.length}/5)</h3>
            <div class="session-actions-header">
                <button id="end-all-sessions-btn" class="danger-button" ${activeSessions.length === 0 ? 'disabled' : ''}>
                    End All Sessions
                </button>
            </div>
        `;
        activeSessionContainer.appendChild(headerDiv);
        
        // Create sessions grid
        const sessionsGrid = document.createElement('div');
        sessionsGrid.className = 'active-sessions-grid';
        
        activeSessions.forEach((session, index) => {
            const sessionCard = document.createElement('div');
            sessionCard.className = 'active-session-card';
            
            // Format start time
            const startTime = new Date(session.start_time);
            const formattedTime = startTime.toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                hour: '2-digit',
                minute: '2-digit',
                day: 'numeric',
                month: 'short'
            });
            
            sessionCard.innerHTML = `
                <div class="session-status">
                    <div class="status-indicator active"></div>
                    <span class="status-text">ACTIVE ${index + 1}</span>
                </div>
                <div class="session-details">
                    <h4>${escapeHtml(session.session_name)}</h4>
                    <p>Room: <strong>${escapeHtml(session.room_number)}</strong></p>
                    <p>Started: ${formattedTime}</p>
                </div>
                <div class="session-actions">
                    <button class="end-session-btn danger-button" data-session-id="${session.id}" data-session-name="${escapeHtml(session.session_name)}">
                        End Session
                    </button>
                </div>
            `;
            
            sessionsGrid.appendChild(sessionCard);
        });
        
        activeSessionContainer.appendChild(sessionsGrid);
        activeSessionContainer.style.display = 'block';
        
        // Update start session button
        if (activeSessions.length >= 5) {
            startSessionBtn.disabled = true;
            startSessionBtn.textContent = 'Maximum Sessions (5/5)';
        } else {
            startSessionBtn.disabled = false;
            startSessionBtn.textContent = `+ Start New Session (${activeSessions.length}/5)`;
        }
        
        // Add event listeners for end session buttons
        document.querySelectorAll('.end-session-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sessionId = e.target.dataset.sessionId;
                const sessionName = e.target.dataset.sessionName;
                handleEndSpecificSession(sessionId, sessionName);
            });
        });
        
        // Add event listener for end all sessions button
        const endAllBtn = document.getElementById('end-all-sessions-btn');
        if (endAllBtn) {
            endAllBtn.addEventListener('click', handleEndAllSessions);
        }
        
    } else {
        console.log('ℹ️ No active sessions');
        
        activeSessionContainer.innerHTML = `
            <div class="no-active-sessions">
                <h3>No Active Sessions</h3>
                <p>Start a new attendance session to begin tracking student attendance.</p>
            </div>
        `;
        activeSessionContainer.style.display = 'block';
        
        startSessionBtn.disabled = false;
        startSessionBtn.textContent = '+ Start New Session (0/5)';
    }
}

async function loadSessionsData() {
    console.log('📋 Loading sessions data...');
    
    try {
        const response = await fetch(getApiUrl(window.CONFIG.endpoints.faculty.sessions), {
            headers: { 'Authorization': `Bearer ${currentFacultyToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch sessions');
        
        allSessions = await response.json();
        console.log('✅ Loaded sessions:', allSessions.length);
        
        populateSessionsTable();
        
    } catch (error) {
        console.error('💥 Error loading sessions:', error);
        showEmptySessionsTable('Error loading sessions');
    }
}

// Updated sessions table population with better status indicators
function populateSessionsTable() {
    if (!sessionsTableBody) return;
    
    if (allSessions.length === 0) {
        showEmptySessionsTable('No sessions found');
        return;
    }
    
    sessionsTableBody.innerHTML = '';
    
    allSessions.forEach(session => {
        const row = document.createElement('tr');
        
        // Format dates
        const startTime = new Date(session.start_time).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const endTime = session.end_time ? 
            new Date(session.end_time).toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : 'Ongoing';
        
        const statusBadge = session.is_active ? 
            '<span class="status-badge status-active">🟢 Active</span>' :
            '<span class="status-badge status-ended">🔴 Ended</span>';
        
        row.innerHTML = `
            <td>
                <div class="session-name-cell">
                    ${escapeHtml(session.session_name)}
                    ${session.is_active ? '<span class="live-indicator">LIVE</span>' : ''}
                </div>
            </td>
            <td><strong>${escapeHtml(session.room_number)}</strong></td>
            <td>${startTime}</td>
            <td>${endTime}</td>
            <td>${statusBadge}</td>
            <td><span class="attendee-count">${session.attendee_count || 0}</span></td>
        `;
        
        // Add special styling for active sessions
        if (session.is_active) {
            row.classList.add('active-session-row');
        }
        
        sessionsTableBody.appendChild(row);
    });
}

function showEmptySessionsTable(message) {
    if (!sessionsTableBody) return;
    
    sessionsTableBody.innerHTML = `
        <tr>
            <td colspan="6" class="empty-state">
                <div>
                    <h3>No Sessions</h3>
                    <p>${message}</p>
                </div>
            </td>
        </tr>
    `;
}

async function loadAttendanceSummary() {
    console.log('📈 Loading attendance summary...');
    
    if (!summaryTableBody) return;
    
    const roomNumber = roomFilter.value;
    const date = dateFilter.value;
    
    try {
        const params = new URLSearchParams();
        if (roomNumber && roomNumber !== 'all') {
            params.append('room_number', roomNumber);
        }
        if (date) {
            params.append('date', date);
        }
        
        const response = await fetch(`${getApiUrl(window.CONFIG.endpoints.faculty.attendanceSummary)}?${params}`, {
            headers: { 'Authorization': `Bearer ${currentFacultyToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch attendance summary');
        
        attendanceSummary = await response.json();
        console.log('✅ Loaded attendance summary:', attendanceSummary.length, 'records');
        
        populateAttendanceSummaryTable();
        
    } catch (error) {
        console.error('💥 Error loading attendance summary:', error);
        showEmptyAttendanceSummaryTable('Error loading attendance data');
    }
}

function populateAttendanceSummaryTable() {
    if (!summaryTableBody) return;
    
    if (attendanceSummary.length === 0) {
        showEmptyAttendanceSummaryTable('No attendance data found');
        return;
    }
    
    summaryTableBody.innerHTML = '';
    
    attendanceSummary.forEach(record => {
        const row = document.createElement('tr');
        
        const percentage = parseFloat(record.percentage);
        let percentageClass = 'poor';
        if (percentage >= 75) percentageClass = 'excellent';
        else if (percentage >= 60) percentageClass = 'good';
        
        const attendanceText = `${record.attended_classes}/${record.total_classes}`;
        
        row.innerHTML = `
            <td>${escapeHtml(record.full_name)}</td>
            <td>${escapeHtml(record.email)}</td>
            <td>${escapeHtml(record.room_number)}</td>
            <td>${attendanceText}</td>
            <td><span class="percentage ${percentageClass}">${record.percentage}%</span></td>
        `;
        
        summaryTableBody.appendChild(row);
    });
}

function showEmptyAttendanceSummaryTable(message) {
    if (!summaryTableBody) return;
    
    summaryTableBody.innerHTML = `
        <tr>
            <td colspan="5" class="empty-state">
                <div>
                    <h3>No Data</h3>
                    <p>${message}</p>
                </div>
            </td>
        </tr>
    `;
}

async function loadStudentsData() {
    console.log('👥 Loading students data...');
    
    if (!studentsTableBody) return;
    
    const roomNumber = studentRoomFilter.value;
    
    try {
        const params = new URLSearchParams();
        if (roomNumber && roomNumber !== 'all') {
            params.append('room_number', roomNumber);
        }
        
        const response = await fetch(`${getApiUrl(window.CONFIG.endpoints.faculty.students)}?${params}`, {
            headers: { 'Authorization': `Bearer ${currentFacultyToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch students');
        
        allStudents = await response.json();
        console.log('✅ Loaded students:', allStudents.length);
        
        populateStudentsTable();
        
    } catch (error) {
        console.error('💥 Error loading students:', error);
        showEmptyStudentsTable('Error loading students data');
    }
}

function populateStudentsTable() {
    if (!studentsTableBody) return;
    
    if (allStudents.length === 0) {
        showEmptyStudentsTable('No students found');
        return;
    }
    
    studentsTableBody.innerHTML = '';
    
    allStudents.forEach(student => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${escapeHtml(student.full_name)}</td>
            <td>${escapeHtml(student.email)}</td>
            <td>${escapeHtml(student.room_number || 'Not Assigned')}</td>
        `;
        
        studentsTableBody.appendChild(row);
    });
}

function showEmptyStudentsTable(message) {
    if (!studentsTableBody) return;
    
    studentsTableBody.innerHTML = `
        <tr>
            <td colspan="3" class="empty-state">
                <div>
                    <h3>No Students</h3>
                    <p>${message}</p>
                </div>
            </td>
        </tr>
    `;
}

// Session management
function openSessionModal() {
    console.log('📝 Opening session modal...');
    
    // Ensure rooms are loaded before opening modal
    if (availableRooms.length === 0) {
        console.log('🔄 Loading rooms before opening modal...');
        loadRoomsData().then(() => {
            sessionModal.style.display = 'block';
            sessionModal.classList.add('show');
            sessionNameInput.focus();
        });
    } else {
        sessionModal.style.display = 'block';
        sessionModal.classList.add('show');
        sessionNameInput.focus();
    }
}

function closeSessionModal() {
    sessionModal.style.display = 'none';
    sessionModal.classList.remove('show');
    sessionForm.reset();
}

function closeAllModals() {
    closeSessionModal();
}

// CORRECTED: Session starting with proper error handling
async function handleStartSession(e) {
    e.preventDefault();
    console.log('▶️ Starting new session...');
    
    const sessionName = sessionNameInput.value.trim();
    const roomNumber = sessionRoomSelect.value;
    
    if (!sessionName || !roomNumber) {
        alert('Please fill in all fields');
        return;
    }
    
    if (activeSessions.length >= 5) {
        alert('Maximum of 5 concurrent sessions allowed. Please end an existing session first.');
        return;
    }
    
    // Check if room already has an active session
    const roomConflict = activeSessions.find(session => session.room_number === roomNumber);
    if (roomConflict) {
        alert(`Room ${roomNumber} already has an active session: "${roomConflict.session_name}". Please end it first or choose a different room.`);
        return;
    }
    
    const submitBtn = sessionForm.querySelector('.primary-button');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Starting...';
    
    try {
        const response = await fetch(getApiUrl(window.CONFIG.endpoints.faculty.sessions), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentFacultyToken}`
            },
            body: JSON.stringify({
                session_name: sessionName,
                room_number: roomNumber
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Session started successfully');
            
            const message = result.message || 'Attendance session started successfully!';
            showSuccessToast(message);
            
            closeSessionModal();
            
            // Refresh data
            await Promise.all([
                checkActiveSession(),
                loadSessionsData()
            ]);
            
        } else {
            alert(result.message || 'Failed to start session');
        }
        
    } catch (error) {
        console.error('💥 Error starting session:', error);
        alert('Error starting session. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// CORRECTED: Handle ending a specific session with proper URL construction
async function handleEndSpecificSession(sessionId, sessionName) {
    console.log('⏹️ Ending specific session:', sessionId, sessionName);
    
    if (!confirm(`Are you sure you want to end the session "${sessionName}"? Students will no longer be able to mark attendance for this session.`)) {
        return;
    }
    
    // Find the button that was clicked and update it
    const endBtn = document.querySelector(`[data-session-id="${sessionId}"]`);
    const originalText = endBtn.textContent;
    endBtn.disabled = true;
    endBtn.textContent = 'Ending...';
    
    try {
        // CORRECTED: Using the proper endpoint construction
        const url = getApiUrl(window.CONFIG.endpoints.faculty.endSession, { id: sessionId });
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${currentFacultyToken}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Session ended successfully');
            
            // Show success message with session details
            const message = result.message || `Session "${sessionName}" ended successfully!`;
            showSuccessToast(message);
            
            // Refresh data
            await Promise.all([
                checkActiveSession(),
                loadSessionsData()
            ]);
            
        } else {
            alert(result.message || 'Failed to end session');
        }
        
    } catch (error) {
        console.error('💥 Error ending session:', error);
        alert('Error ending session. Please try again.');
    } finally {
        endBtn.disabled = false;
        endBtn.textContent = originalText;
    }
}

// Handle ending all sessions
async function handleEndAllSessions() {
    console.log('⏹️ Ending all active sessions...');
    
    if (!confirm(`Are you sure you want to end ALL ${activeSessions.length} active sessions? This will prevent students from marking attendance in any room.`)) {
        return;
    }
    
    const endAllBtn = document.getElementById('end-all-sessions-btn');
    const originalText = endAllBtn.textContent;
    endAllBtn.disabled = true;
    endAllBtn.textContent = 'Ending All...';
    
    try {
        // Using faculty endpoints for end all
        const response = await fetch(getApiUrl(window.CONFIG.endpoints.faculty.endAllSessions), {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${currentFacultyToken}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ All sessions ended successfully');
            
            const message = result.message || 'All sessions ended successfully!';
            showSuccessToast(message);
            
            // Refresh data
            await Promise.all([
                checkActiveSession(),
                loadSessionsData()
            ]);
            
        } else {
            alert(result.message || 'Failed to end all sessions');
        }
        
    } catch (error) {
        console.error('💥 Error ending all sessions:', error);
        alert('Error ending all sessions. Please try again.');
    } finally {
        endAllBtn.disabled = false;
        endAllBtn.textContent = originalText;
    }
}

// Filter functions
function clearDateFilter() {
    dateFilter.value = '';
    loadAttendanceSummary();
}

// Utility functions
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return String(text).replace(/[&<>"']/g, function(m) { return map[m]; });
}

function togglePassword() {
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.querySelector('.toggle-password .eye-icon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.innerHTML = `
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
            <path d="m1 1 22 22"></path>
        `;
    } else {
        passwordInput.type = 'password';
        eyeIcon.innerHTML = `
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        `;
    }
}

// Utility function to show success toast notifications
function showSuccessToast(message) {
    // Remove existing toast if any
    const existingToast = document.querySelector('.success-toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create toast
    const toast = document.createElement('div');
    toast.className = 'success-toast';
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">✅</span>
            <span class="toast-message">${escapeHtml(message)}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Show animation
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Auto remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// CORRECTED: Utility function to build API URLs with proper parameter substitution
function getApiUrl(endpoint, params = {}) {
    let url = endpoint;
    
    // Replace URL parameters like {id} with actual values
    for (const [key, value] of Object.entries(params)) {
        url = url.replace(`{${key}}`, value);
    }
    
    return url;
}

// Global functions (called from HTML)
window.showTab = showTab;
window.openSessionModal = openSessionModal;
window.closeSessionModal = closeSessionModal;
window.togglePassword = togglePassword;

console.log('✅ Faculty dashboard JavaScript initialized with multiple sessions support (max 5 concurrent sessions)');
