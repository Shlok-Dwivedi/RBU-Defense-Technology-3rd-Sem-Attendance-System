// Add these functions to your faculty.js file or create a new mobile-utils.js

// Function to make tables mobile-responsive
function makeMobileResponsive() {
    const tables = document.querySelectorAll('.data-table');
    
    tables.forEach(table => {
        const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
        const rows = table.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            cells.forEach((cell, index) => {
                if (headers[index]) {
                    cell.setAttribute('data-label', headers[index]);
                }
            });
        });
        
        // Add mobile class for CSS targeting
        table.closest('.table-container').classList.add('mobile-responsive');
    });
}

// Function to detect mobile and apply appropriate styles
function handleMobileLayout() {
    const isMobile = window.innerWidth <= 768;
    const tables = document.querySelectorAll('.table-container');
    
    tables.forEach(container => {
        if (isMobile) {
            container.classList.add('mobile-layout');
        } else {
            container.classList.remove('mobile-layout');
        }
    });
}

// Truncate long text for mobile display
function truncateTextForMobile() {
    const emailCells = document.querySelectorAll('.data-table td:nth-child(2)');
    const nameCells = document.querySelectorAll('.data-table td:nth-child(1)');
    
    emailCells.forEach(cell => {
        cell.classList.add('email-cell');
        if (window.innerWidth <= 768 && cell.textContent.length > 20) {
            cell.title = cell.textContent; // Add full text as tooltip
        }
    });
    
    nameCells.forEach(cell => {
        if (window.innerWidth <= 768 && cell.textContent.length > 15) {
            cell.title = cell.textContent; // Add full name as tooltip
        }
    });
}

// Enhanced data population functions with mobile considerations

// Update the existing populateSessionsTable function
function populateSessionsTable(sessions) {
    const tableBody = document.getElementById('sessions-table-body');
    
    if (!sessions || sessions.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <div class="empty-state">
                        <h3>No Sessions Yet</h3>
                        <p>Start your first attendance session to see data here.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = sessions.map(session => {
        const startTime = new Date(session.start_time).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const endTime = session.end_time ? 
            new Date(session.end_time).toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : '-';

        const status = session.is_active ? 
            '<span class="status-badge status-active">Active</span>' : 
            '<span class="status-badge status-ended">Ended</span>';

        return `
            <tr>
                <td data-label="Session Name" class="session-name-cell">${session.session_name}</td>
                <td data-label="Room">${session.room_number}</td>
                <td data-label="Start Time">${startTime}</td>
                <td data-label="End Time">${endTime}</td>
                <td data-label="Status">${status}</td>
                <td data-label="Attendees">${session.attendee_count || 0}</td>
            </tr>
        `;
    }).join('');
    
    // Apply mobile enhancements
    makeMobileResponsive();
    truncateTextForMobile();
}

// Update the existing populateAttendanceSummary function
function populateAttendanceSummary(data) {
    const tableBody = document.getElementById('summary-table-body');
    
    if (!data || data.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    <div class="empty-state">
                        <h3>No Attendance Data</h3>
                        <p>Attendance records will appear here once students start marking attendance.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = data.map(student => {
        let percentageClass = 'poor';
        if (student.percentage >= 80) percentageClass = 'excellent';
        else if (student.percentage >= 60) percentageClass = 'good';

        const studentTypeClass = student.student_type === 'attendance_only' ? 'attendance-only' : '';

        return `
            <tr class="${studentTypeClass}">
                <td data-label="Full Name">${student.full_name || student.email}</td>
                <td data-label="Email" class="email-cell">${student.email}</td>
                <td data-label="Room No.">${student.room_number || 'N/A'}</td>
                <td data-label="Attendance">${student.present_count}/${student.total_sessions}</td>
                <td data-label="Percentage">
                    <span class="percentage ${percentageClass}">
                        ${student.percentage.toFixed(1)}%
                    </span>
                </td>
            </tr>
        `;
    }).join('');
    
    // Apply mobile enhancements
    makeMobileResponsive();
    truncateTextForMobile();
}

// Update the existing populateStudentsTable function
function populateStudentsTable(students) {
    const tableBody = document.getElementById('students-table-body');
    
    if (!students || students.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="3" class="empty-state">
                    <div class="empty-state">
                        <h3>No Students Found</h3>
                        <p>Student data will appear here once they start marking attendance.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = students.map(student => {
        const studentTypeClass = student.student_type === 'attendance_only' ? 'attendance-only' : '';
        
        return `
            <tr class="${studentTypeClass}">
                <td data-label="Full Name">${student.full_name || student.email}</td>
                <td data-label="Email" class="email-cell">${student.email}</td>
                <td data-label="Room No.">${student.room_number || 'N/A'}</td>
            </tr>
        `;
    }).join('');
    
    // Apply mobile enhancements
    makeMobileResponsive();
    truncateTextForMobile();
}

// Initialize mobile responsiveness
function initMobileSupport() {
    // Apply initial mobile layout
    handleMobileLayout();
    
    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            handleMobileLayout();
            truncateTextForMobile();
        }, 250);
    });
    
    // Apply responsive styles on DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        makeMobileResponsive();
        handleMobileLayout();
        truncateTextForMobile();
    });
}

// Call initialization
initMobileSupport();
