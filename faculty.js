// Faculty Dashboard JavaScript - Updated with Dynamic Room Loading
console.log('🚀 Faculty dashboard JavaScript loaded');

// Global state management
let currentFacultyToken = null;
let activeSession = null;
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
const activeSessionName = document.getElementById('active-session-name');
const activeSessionRoom = document.getElementById('active-session-room');
const activeSessionTime = document.getElementById('active-session-time');
const endSessionBtn = document.getElementById('end-session-btn');
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
    endSessionBtn.addEventListener('click', handleEndSession);
    
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
        const response = await fetch('/api/faculty/login', {
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
    activeSession = null;
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
        const response = await fetch('/api/faculty/rooms', {
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

async function checkActiveSession() {
    console.log('🔍 Checking for active session...');
    
    try {
        const response = await fetch('/api/faculty/sessions/active', {
            headers: { 'Authorization': `Bearer ${currentFacultyToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to check active session');
        
        const data = await response.json();
        activeSession = data.session;
        
        updateActiveSessionDisplay();
        
    } catch (error) {
        console.error('💥 Error checking active session:', error);
        activeSession = null;
        updateActiveSessionDisplay();
    }
}

function updateActiveSessionDisplay() {
    if (activeSession) {
        console.log('✅ Active session found:', activeSession.session_name);
        
        activeSessionContainer.style.display = 'block';
        activeSessionName.textContent = activeSession.session_name;
        activeSessionRoom.textContent = activeSession.room_number;
        
        // Format start time
        const startTime = new Date(activeSession.start_time);
        activeSessionTime.textContent = startTime.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            day: 'numeric',
            month: 'short'
        });
        
        startSessionBtn.disabled = true;
        startSessionBtn.textContent = 'Session Active';
        
    } else {
        console.log('ℹ️ No active session');
        
        activeSessionContainer.style.display = 'none';
        startSessionBtn.disabled = false;
        startSessionBtn.textContent = '+ Start New Session';
    }
}

async function loadSessionsData() {
    console.log('📋 Loading sessions data...');
    
    try {
        const response = await fetch('/api/faculty/sessions', {
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
            '<span class="status-badge status-active">Active</span>' :
            '<span class="status-badge status-ended">Ended</span>';
        
        row.innerHTML = `
            <td>${escapeHtml(session.session_name)}</td>
            <td>${escapeHtml(session.room_number)}</td>
            <td>${startTime}</td>
            <td>${endTime}</td>
            <td>${statusBadge}</td>
            <td>${session.attendee_count || 0}</td>
        `;
        
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
        
        const response = await fetch(`/api/faculty/attendance-summary?${params}`, {
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
        
        const response = await fetch(`/api/faculty/students?${params}`, {
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

async function handleStartSession(e) {
    e.preventDefault();
    console.log('▶️ Starting new session...');
    
    const sessionName = sessionNameInput.value.trim();
    const roomNumber = sessionRoomSelect.value;
    
    if (!sessionName || !roomNumber) {
        alert('Please fill in all fields');
        return;
    }
    
    if (activeSession) {
        alert('There is already an active session. Please end it first.');
        return;
    }
    
    const submitBtn = sessionForm.querySelector('.primary-button');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Starting...';
    
    try {
        const response = await fetch('/api/faculty/sessions', {
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
            alert('Attendance session started successfully!');
            
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

async function handleEndSession() {
    console.log('⏹️ Ending active session...');
    
    if (!activeSession) {
        alert('No active session to end');
        return;
    }
    
    if (!confirm('Are you sure you want to end this session? Students will no longer be able to mark attendance.')) {
        return;
    }
    
    const originalText = endSessionBtn.textContent;
    endSessionBtn.disabled = true;
    endSessionBtn.textContent = 'Ending...';
    
    try {
        const response = await fetch(`/api/faculty/sessions/${activeSession.id}/end`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${currentFacultyToken}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Session ended successfully');
            alert('Session ended successfully!');
            
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
        endSessionBtn.disabled = false;
        endSessionBtn.textContent = originalText;
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

// Global functions (called from HTML)
window.showTab = showTab;
window.openSessionModal = openSessionModal;
window.closeSessionModal = closeSessionModal;
window.togglePassword = togglePassword;

console.log('✅ Faculty dashboard JavaScript initialized with dynamic room loading');