require('dotenv').config({ path: './credentials.env' });
console.log('DATABASE_URL from .env:', process.env.DATABASE_URL);
console.log('🚀 server.js started running');

require('dotenv').config({ path: './credentials.env' });

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-jwt-secret';

// Allowed locations with 5m radius (coordinates and elevation in meters)
const ALLOWED_LOCATIONS = [
     { name: 'My Location',
        lat: 21.09509835312697, 
        lng: 79.07928090334806, 
        elevation: 242, 
        radius: 25, 
    },

     { name: 'My Location-mobile',
        lat: 21.094416900, 
        lng: 79.079032800, 
        elevation: 242.20, 
        radius: 25, 
    },

     { name: 'Shubham Bhai',
        lat: 23.259933300, 
        lng: 77.412615000, 
        elevation: 242, 
        radius: 100, 
    },


      { 
        name: 'PS Location', //NEED TO CHANGE
        lat: 21.145425200, 
        lng: 79.147865600, 
        elevation: 232.40
        radius: 20 
    },

    { 
        name: '403 Test', //NEED TO CHANGE
        lat: 21.176865486, 
        lng: 79.061328692, 
        elevation: 288.80,
        radius: 50
    },


    // New Location 2 (Replace with your data)
    { 
        name: 'Mech Building', //NEED TO CHANGE
        lat: 21.094001, 
        lng: 79.078001, 
        elevation: 240,
        radius: 50 
    },
    // New Location 3 (Replace with your data)
    { 
        name: 'DT-701', //NEED TO CHANGE
        lat: 21.097555, 
        lng: 79.081555, 
        elevation: 250,
        radius: 10
    }
];

const LOCATION_RADIUS = 25; // meters

// --- Enhanced Middleware with Logging ---
app.use((req, res, next) => {
    const istTime = new Date().toLocaleString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    console.log(`${istTime} - ${req.method} ${req.path}`);
    next();
});

app.use(cors({
    origin: [
        'http://localhost:3000', 
        'https://stellular-platypus-675f9e.netlify.app/',
         'https://rbudefmdm.ddns.net/api'// Add this line
    ],
     credentials:true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname)));

// Database connection pool
const pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionLimit: 10,
    queueLimit: 0,
    idleTimeout: 60000,
    timezone: '+05:30' // IST timezone
});

// Test database connection
async function testDbConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
    }
}

// Utility function to calculate distance between two coordinates
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in meters
}




/*function isLocationAllowed(lat, lng, elevation) {
    for (const location of ALLOWED_LOCATIONS) {
        const distance = calculateDistance(lat, lng, location.lat, location.lng);
        
        // The elevation check has been removed from this 'if' statement
        if (distance <= LOCATION_RADIUS) {
            return { allowed: true, location: location.name };
        }
    }
    return { allowed: false, location: null };
}
*/
// server.js

function isLocationAllowed(lat, lng, elevation) {
    // Loop through each location object in the ALLOWED_LOCATIONS array
    for (const location of ALLOWED_LOCATIONS) {
        
        // Calculate the distance from the student to the current location in the loop
        const distance = calculateDistance(lat, lng, location.lat, location.lng);
        
        // Calculate the difference in elevation
        const elevationDiff = Math.abs((elevation || location.elevation) - location.elevation);
        
        // Check if the student is within this specific location's radius and elevation tolerance
        if (distance <= location.radius && elevationDiff <= 10) { // Using 10m elevation tolerance
            // If they are, immediately return true and the name of the valid location
            return { allowed: true, location: location.name };
        }
    }
    
    // If the loop finishes and no match was found, the student is not in any allowed zone
    return { allowed: false, location: null };
}

// --- ROOT ROUTE ---
app.get('/', (req, res) => {
    console.log('📄 Serving index.html');
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- FACULTY LOGIN ENDPOINT ---
app.post('/api/faculty/login', [
    body('username').notEmpty().trim(),
    body('password').notEmpty()
], async (req, res) => {
    console.log('🔐 Login attempt received');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid input data.',
            errors: errors.array()
        });
    }

    const { username, password } = req.body;
    
    try {
        const [rows] = await pool.query('SELECT * FROM faculty WHERE username = ?', [username.trim()]);
        
        if (rows.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials.' 
            });
        }
        
        const faculty = rows[0];
        
        // Compare password with hashed password in database
        const isValidPassword = await bcrypt.compare(password, faculty.password);
        
        if (!isValidPassword) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials.' 
            });
        }
        
        const token = jwt.sign(
            { id: faculty.id, username: faculty.username }, 
            JWT_SECRET, 
            { expiresIn: '8h' }
        );
        
        console.log('✅ Login successful for:', username);
        res.json({ 
            success: true, 
            token, 
            message: 'Login successful' 
        });
        
    } catch (error) {
        console.error('💥 Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during authentication.' 
        });
    }
});

// --- AUTH MIDDLEWARE ---
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.sendStatus(401);
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
};

// --- SESSION MANAGEMENT ENDPOINTS ---

// Get all sessions (updated to show multiple active sessions)
app.get('/api/faculty/sessions', authMiddleware, async (req, res) => {
    console.log('📋 Fetching all sessions');
    try {
        const query = `
            SELECT 
                s.*,
                COUNT(ar.id) as attendee_count
            FROM attendance_sessions s
            LEFT JOIN attendance_records ar ON s.id = ar.session_id
            GROUP BY s.id
            ORDER BY s.is_active DESC, s.start_time DESC
        `;
        
        const [rows] = await pool.query(query);
        console.log('✅ Found sessions:', rows.length);
        res.json(rows);
    } catch (error) {
        console.error('💥 Error fetching sessions:', error);
        res.status(500).json({ message: 'Failed to fetch sessions.' });
    }
});

// Get active sessions (updated to return multiple active sessions)
app.get('/api/faculty/sessions/active', authMiddleware, async (req, res) => {
    console.log('🔴 Fetching active sessions');
    try {
        const [rows] = await pool.query(
            'SELECT * FROM attendance_sessions WHERE is_active = TRUE ORDER BY start_time DESC'
        );
        
        console.log(`✅ Found ${rows.length} active session(s)`);
        res.json({ 
            sessions: rows,
            count: rows.length 
        });
    } catch (error) {
        console.error('💥 Error fetching active sessions:', error);
        res.status(500).json({ message: 'Failed to fetch active sessions.' });
    }
});

// Start new session with 5-session limit
app.post('/api/faculty/sessions', authMiddleware, [
    body('session_name').notEmpty().trim(),
    body('room_number').notEmpty().trim()
], async (req, res) => {
    console.log('▶️ Starting new session:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Invalid input data',
            errors: errors.array()
        });
    }

    const { session_name, room_number } = req.body;
    
    try {
        // Check active session count (limit to 5)
        const [activeRows] = await pool.query(
            'SELECT COUNT(*) as active_count FROM attendance_sessions WHERE is_active = TRUE'
        );
        
        const activeCount = activeRows[0].active_count;
        
        if (activeCount >= 5) {
            return res.status(409).json({
                success: false,
                message: 'Maximum of 5 concurrent sessions allowed. Please end an existing session before starting a new one.'
            });
        }
        
        // Check if there's already an active session for this room
        const [roomSessionRows] = await pool.query(
            'SELECT id, session_name FROM attendance_sessions WHERE is_active = TRUE AND room_number = ?',
            [room_number]
        );
        
        if (roomSessionRows.length > 0) {
            return res.status(409).json({
                success: false,
                message: `Room ${room_number} already has an active session: "${roomSessionRows[0].session_name}". Please end it before starting a new session for this room.`
            });
        }
        
        // Create new session
        const [result] = await pool.query(
            'INSERT INTO attendance_sessions (session_name, room_number, started_by, start_time, is_active) VALUES (?, ?, ?, NOW(), TRUE)',
            [session_name, room_number, req.user.username]
        );
        
        console.log('✅ Session started successfully:', session_name, 'for room:', room_number);
        console.log(`📊 Active sessions: ${activeCount + 1}/5`);
        
        res.status(201).json({
            success: true,
            message: `Attendance session started successfully! (${activeCount + 1}/5 active sessions)`,
            session_id: result.insertId,
            active_sessions_count: activeCount + 1
        });
        
    } catch (error) {
        console.error('💥 Error starting session:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start session.'
        });
    }
});

// End specific session by ID
app.put('/api/faculty/sessions/:id/end', authMiddleware, async (req, res) => {
    console.log('⏹️ Ending session:', req.params.id);
    
    const sessionId = req.params.id;
    
    try {
        // Get session details before ending
        const [sessionRows] = await pool.query(
            'SELECT session_name, room_number FROM attendance_sessions WHERE id = ? AND is_active = TRUE',
            [sessionId]
        );
        
        if (sessionRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Session not found or already ended.'
            });
        }
        
        const session = sessionRows[0];
        
        // End the session
        const [result] = await pool.query(
            'UPDATE attendance_sessions SET is_active = FALSE, end_time = NOW() WHERE id = ? AND is_active = TRUE',
            [sessionId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Session not found or already ended.'
            });
        }
        
        // Get updated active session count
        const [activeRows] = await pool.query(
            'SELECT COUNT(*) as active_count FROM attendance_sessions WHERE is_active = TRUE'
        );
        
        const remainingActive = activeRows[0].active_count;
        
        console.log('✅ Session ended successfully:', session.session_name);
        console.log(`📊 Remaining active sessions: ${remainingActive}/5`);
        
        res.json({
            success: true,
            message: `Session "${session.session_name}" for Room ${session.room_number} ended successfully! (${remainingActive}/5 active sessions remaining)`,
            remaining_active_sessions: remainingActive
        });
        
    } catch (error) {
        console.error('💥 Error ending session:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to end session.'
        });
    }
});

// End all active sessions (new endpoint for emergency situations)
app.put('/api/faculty/sessions/end-all', authMiddleware, async (req, res) => {
    console.log('⏹️ Ending all active sessions');
    
    try {
        const [result] = await pool.query(
            'UPDATE attendance_sessions SET is_active = FALSE, end_time = NOW() WHERE is_active = TRUE'
        );
        
        console.log('✅ All sessions ended successfully, affected:', result.affectedRows);
        
        res.json({
            success: true,
            message: `All ${result.affectedRows} active sessions have been ended.`,
            sessions_ended: result.affectedRows
        });
        
    } catch (error) {
        console.error('💥 Error ending all sessions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to end all sessions.'
        });
    }
});

// --- UPDATED STUDENT ATTENDANCE ENDPOINT ---
app.post('/api/attendance', [
    body('email').isEmail().normalizeEmail(),
    body('latitude').isFloat(),
    body('longitude').isFloat(),
    body('elevation').optional().isFloat(),
    body('deviceId').notEmpty().trim()
], async (req, res) => {
    console.log('📝 Attendance marking attempt:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Invalid input data',
            errors: errors.array()
        });
    }
    
    const { email, latitude, longitude, elevation = 242, deviceId } = req.body;
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD in IST
    
    try {
        // Check if student exists first
        const [studentRows] = await pool.query('SELECT * FROM students WHERE email = ?', [email]);
        
        if (studentRows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Student email not found in the roster.' 
            });
        }
        
        const student = studentRows[0];
        
        // Check if there's an active session for student's room
        const [sessionRows] = await pool.query(
            'SELECT id, session_name, room_number FROM attendance_sessions WHERE is_active = TRUE AND room_number = ? ORDER BY start_time DESC LIMIT 1',
            [student.room_number]
        );
        
        if (sessionRows.length === 0) {
            return res.status(403).json({ 
                success: false, 
                message: `No active attendance session for Room ${student.room_number || 'Not Assigned'}. Please wait for faculty to start a session for your room.` 
            });
        }
        
        const activeSession = sessionRows[0];
        console.log('🏫 Active session found for room:', activeSession.room_number, '- Session:', activeSession.session_name);
        
        // Verify geolocation
        const locationCheck = isLocationAllowed(latitude, longitude, elevation);
        if (!locationCheck.allowed) {
            return res.status(403).json({
                success: false,
                message: 'You must be within the university premises to mark attendance.'
            });
        }
        
        console.log('✅ Location verified:', locationCheck.location);
        
        // Check if device already marked attendance for this session
        const [deviceRows] = await pool.query(
            'SELECT id FROM attendance_records WHERE device_id = ? AND session_id = ?',
            [deviceId, activeSession.id]
        );
        
        if (deviceRows.length > 0) {
            return res.status(409).json({ 
                success: false, 
                message: 'This device has already been used to mark attendance for this session.' 
            });
        }
        
        // Check if student already marked attendance for this session
        const [existingRows] = await pool.query(
            'SELECT id FROM attendance_records WHERE student_email = ? AND session_id = ?',
            [email, activeSession.id]
        );
        
        if (existingRows.length > 0) {
            return res.status(409).json({ 
                success: false, 
                message: 'You have already marked attendance for this session.' 
            });
        }
        
        // Mark attendance with location and device info
        await pool.query(
            `INSERT INTO attendance_records 
            (student_email, attendance_date, status, session_id, latitude, longitude, elevation, device_id, location_name) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [email, today, 'P', activeSession.id, latitude, longitude, elevation, deviceId, locationCheck.location]
        );
        
        console.log('✅ Attendance marked for:', email, 'in session:', activeSession.session_name, 'for room:', activeSession.room_number);
        res.status(201).json({ 
            success: true, 
            message: `Attendance marked for session: ${activeSession.session_name} (Room ${activeSession.room_number})` 
        });
        
    } catch (error) {
        console.error('💥 Database Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'A server error occurred.' 
        });
    }
});

// --- UPDATED FACULTY DATA ROUTES ---

// Get students with room filter
app.get('/api/faculty/students', authMiddleware, async (req, res) => {
    console.log('📊 Fetching students data');
    const { room_number } = req.query;
    
    try {
        let query = 'SELECT email, full_name, room_number FROM students';
        let params = [];
        
        if (room_number && room_number !== 'all') {
            query += ' WHERE room_number = ?';
            params.push(room_number);
        }
        
        query += ' ORDER BY full_name';
        
        const [rows] = await pool.query(query, params);
        console.log('✅ Found students:', rows.length);
        res.json(rows);
    } catch (e) {
        console.error('💥 Error fetching students:', e);
        res.status(500).json({ message: 'Failed to fetch students.' });
    }
});

// Get distinct room numbers
app.get('/api/faculty/rooms', authMiddleware, async (req, res) => {
    console.log('🏠 Fetching room numbers');
    try {
        const query = `
            SELECT DISTINCT room_number 
            FROM students 
            WHERE room_number IS NOT NULL 
            ORDER BY room_number
        `;
        
        const [rows] = await pool.query(query);
        const rooms = rows.map(row => row.room_number);
        console.log('✅ Found rooms:', rooms);
        res.json(rooms);
    } catch (e) {
        console.error('💥 Error fetching rooms:', e);
        res.status(500).json({ message: 'Failed to fetch rooms.' });
    }
});

// Get attendance summary with room filter
app.get('/api/faculty/attendance-summary', authMiddleware, async (req, res) => {
    console.log('📈 Fetching attendance summary');
    const { room_number, date } = req.query;

    let query = `
        SELECT 
            ar.student_email as email,
            COALESCE(s.full_name, 'Unknown Student') as full_name,
            COALESCE(s.room_number, 'Not Assigned') as room_number,
            COUNT(ar.attendance_date) AS total_classes,
            SUM(CASE WHEN ar.status = 'P' THEN 1 ELSE 0 END) AS attended_classes,
            MAX(ar.attendance_date) as last_attendance
        FROM attendance_records ar
        LEFT JOIN students s ON ar.student_email = s.email
    `;
    
    const params = [];
    const whereClauses = [];

    if (room_number && room_number !== 'all') {
        whereClauses.push('COALESCE(s.room_number, "Not Assigned") = ?');
        params.push(room_number);
    }

    if (date) {
        whereClauses.push('ar.attendance_date = ?');
        params.push(date);
    }
    
    if (whereClauses.length > 0) {
        query += ' WHERE ' + whereClauses.join(' AND ');
    }

    query += ' GROUP BY ar.student_email ORDER BY full_name;';

    try {
        const [rows] = await pool.query(query, params);
        const summary = rows.map(row => ({
            ...row,
            percentage: row.total_classes > 0 ? ((row.attended_classes / row.total_classes) * 100).toFixed(1) : '0.0'
        }));
        console.log('✅ Generated attendance summary:', summary.length, 'records');
        res.json(summary);
    } catch (error) {
        console.error("💥 Summary Error:", error);
        res.status(500).json({ message: 'Failed to generate attendance summary.' });
    }
});

// --- CHECK SESSION STATUS ENDPOINT (updated for student page) ---
app.get('/api/session-status', async (req, res) => {
    console.log('🔍 Checking session status');
    const { email } = req.query;
    
    try {
        if (email) {
            // If email provided, check for active session for student's specific room
            const [studentRows] = await pool.query('SELECT room_number FROM students WHERE email = ?', [email]);
            
            if (studentRows.length === 0) {
                return res.json({ 
                    active: false, 
                    session: null,
                    message: 'Student not found' 
                });
            }
            
            const studentRoom = studentRows[0].room_number;
            
            const [sessionRows] = await pool.query(
                'SELECT id, session_name, room_number FROM attendance_sessions WHERE is_active = TRUE AND room_number = ? ORDER BY start_time DESC LIMIT 1',
                [studentRoom]
            );
            
            if (sessionRows.length > 0) {
                res.json({ 
                    active: true, 
                    session: sessionRows[0],
                    student_room: studentRoom
                });
            } else {
                res.json({ 
                    active: false, 
                    session: null,
                    student_room: studentRoom,
                    message: `No active session for Room ${studentRoom}`
                });
            }
        } else {
            // General check - return count of active sessions
            const [rows] = await pool.query(
                'SELECT COUNT(*) as active_count FROM attendance_sessions WHERE is_active = TRUE'
            );
            
            const activeCount = rows[0].active_count;
            
            res.json({ 
                active: activeCount > 0, 
                active_sessions_count: activeCount,
                message: activeCount > 0 ? `${activeCount} active session(s)` : 'No active sessions'
            });
        }
    } catch (error) {
        console.error('💥 Error checking session status:', error);
        res.status(500).json({ 
            active: false, 
            message: 'Error checking session status' 
        });
    }
});

// --- UTILITY ENDPOINT FOR PASSWORD HASHING ---
app.post('/api/hash-password', async (req, res) => {
    const { password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 12);
        res.json({ hashedPassword });
    } catch (error) {
        res.status(500).json({ error: 'Failed to hash password' });
    }
});

// --- CATCH-ALL FOR UNDEFINED ROUTES ---
app.use((req, res) => {
    console.log('❓ Route not found:', req.method, req.path);
    res.status(404).json({ 
        success: false, 
        message: `Route ${req.method} ${req.path} not found` 
    });
});

// --- ERROR HANDLER ---
app.use((error, req, res, next) => {
    console.error('💥 Server error:', error);
    res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
    });
});


// --- START SERVER ---
app.listen(port, '0.0.0.0', async () => {
    console.log('🚀 Server starting...');
    console.log(`✅ Server listening on port ${port}`); // Corrected log message
    await testDbConnection();
    console.log('✅ Server ready!');
    // ...
});


/*// --- START SERVER ---
app.listen(port, async () => {
    console.log('🚀 Server starting...');
    console.log(`📍 Server is running on http://localhost:${port}`);
    console.log(`🌐 Access your student portal at: http://localhost:${port}`);
    console.log(`🌐 Access your faculty dashboard at: http://localhost:${port}/faculty.html`);
    await testDbConnection();
    console.log('✅ Server ready!');
    console.log('🗝️ Password Encryption: Use bcrypt with 12 rounds');
    console.log('📍 Allowed locations configured for university premises');

});*/



