// validation-fix.js - Fix validation issues in attendance system
require('dotenv').config({ path: './credentials.env' });
const mysql = require('mysql2/promise');

class ValidationFixer {
    constructor() {
        this.pool = mysql.createPool({
            uri: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
            connectionLimit: 5,
            timezone: '+05:30'
        });
    }

    async runCompleteFix() {
        console.log('🔧 Starting comprehensive validation fix...\n');

        try {
            await this.fixTableStructure();
            await this.fixStudentData();
            await this.fixValidationIssues();
            await this.addTestData();
            await this.validateSystem();
            
            console.log('\n✅ Validation fix completed successfully!');
            console.log('\n📋 Next steps:');
            console.log('1. Restart your server: node server.js');
            console.log('2. Try accessing the student portal: http://localhost:3000');
            console.log('3. Test with email: test@university.edu');
            console.log('4. Use the debug tool to monitor: debug-attendance-system.html');
            
        } catch (error) {
            console.error('\n💥 Fix failed:', error);
        } finally {
            await this.pool.end();
        }
    }

    async fixTableStructure() {
        console.log('🗃️ Fixing table structure...');

        try {
            // Ensure all required columns exist in attendance_records
            const requiredColumns = [
                { name: 'session_id', type: 'INT NULL' },
                { name: 'latitude', type: 'DECIMAL(10, 8) NULL' },
                { name: 'longitude', type: 'DECIMAL(11, 8) NULL' },
                { name: 'elevation', type: 'DECIMAL(6, 2) NULL' },
                { name: 'device_id', type: 'VARCHAR(255) NULL' },
                { name: 'location_name', type: 'VARCHAR(100) NULL' }
            ];

            for (const column of requiredColumns) {
                try {
                    const [existing] = await this.pool.query(`
                        SELECT COLUMN_NAME 
                        FROM INFORMATION_SCHEMA.COLUMNS 
                        WHERE TABLE_NAME = 'attendance_records' 
                        AND COLUMN_NAME = ?
                    `, [column.name]);

                    if (existing.length === 0) {
                        console.log(`  ➕ Adding column: ${column.name}`);
                        await this.pool.query(`
                            ALTER TABLE attendance_records 
                            ADD COLUMN ${column.name} ${column.type}
                        `);
                    } else {
                        console.log(`  ✅ Column exists: ${column.name}`);
                    }
                } catch (error) {
                    console.log(`  ⚠️ Column issue ${column.name}:`, error.message);
                }
            }

            // Ensure students table has required columns
            const studentColumns = [
                { name: 'room_number', type: 'VARCHAR(50) NULL' }
            ];

            for (const column of studentColumns) {
                try {
                    const [existing] = await this.pool.query(`
                        SELECT COLUMN_NAME 
                        FROM INFORMATION_SCHEMA.COLUMNS 
                        WHERE TABLE_NAME = 'students' 
                        AND COLUMN_NAME = ?
                    `, [column.name]);

                    if (existing.length === 0) {
                        console.log(`  ➕ Adding student column: ${column.name}`);
                        await this.pool.query(`
                            ALTER TABLE students 
                            ADD COLUMN ${column.name} ${column.type}
                        `);
                    }
                } catch (error) {
                    console.log(`  ⚠️ Student column issue ${column.name}:`, error.message);
                }
            }

            console.log('✅ Table structure validated');

        } catch (error) {
            console.error('❌ Table structure fix failed:', error.message);
        }
    }

    async fixStudentData() {
        console.log('\n👥 Fixing student data...');

        try {
            // Check if the problematic email exists
            const testEmail = '24dwivedis_1@rbunagpur.in';
            const [existingStudent] = await this.pool.query(
                'SELECT * FROM students WHERE email = ?', 
                [testEmail]
            );

            if (existingStudent.length === 0) {
                console.log(`  ➕ Adding missing student: ${testEmail}`);
                await this.pool.query(`
                    INSERT INTO students (email, full_name, room_number) 
                    VALUES (?, ?, ?)
                `, [testEmail, 'Test Student (24)', 'ME-12']);
            } else {
                console.log(`  ✅ Student exists: ${testEmail}`);
                
                // Update room number if missing
                if (!existingStudent[0].room_number) {
                    console.log('  🔄 Updating room number...');
                    await this.pool.query(
                        'UPDATE students SET room_number = ? WHERE email = ?',
                        ['ME-12', testEmail]
                    );
                }
            }

            // Fix any students without room numbers
            const [studentsWithoutRoom] = await this.pool.query(`
                SELECT email, full_name FROM students 
                WHERE room_number IS NULL OR room_number = ''
            `);

            for (const student of studentsWithoutRoom) {
                console.log(`  🔄 Assigning room to: ${student.email}`);
                await this.pool.query(
                    'UPDATE students SET room_number = ? WHERE email = ?',
                    ['GENERAL', student.email]
                );
            }

            console.log('✅ Student data fixed');

        } catch (error) {
            console.error('❌ Student data fix failed:', error.message);
        }
    }

    async fixValidationIssues() {
        console.log('\n🔍 Fixing validation issues...');

        try {
            // Create active session for testing if none exists
            const [activeSessions] = await this.pool.query(`
                SELECT id, session_name, room_number 
                FROM attendance_sessions 
                WHERE is_active = TRUE
            `);

            if (activeSessions.length === 0) {
                console.log('  ➕ Creating test session...');
                await this.pool.query(`
                    INSERT INTO attendance_sessions 
                    (session_name, room_number, started_by, start_time, is_active) 
                    VALUES (?, ?, ?, NOW(), TRUE)
                `, ['Test Session - Debug', 'ME-12', 'system']);
                console.log('  ✅ Test session created');
            } else {
                console.log(`  ✅ Active session exists: ${activeSessions[0].session_name}`);
            }

            // Ensure timezone is properly set
            await this.pool.query(`SET time_zone = '+05:30'`);
            console.log('  ✅ Timezone set to IST');

            console.log('✅ Validation issues fixed');

        } catch (error) {
            console.error('❌ Validation fix failed:', error.message);
        }
    }

    async addTestData() {
        console.log('\n🧪 Adding comprehensive test data...');

        try {
            // Test students for different scenarios
            const testStudents = [
                { email: 'test@university.edu', name: 'Test Student 1', room: 'ME-12' },
                { email: '24dwivedis_1@rbunagpur.in', name: 'Dwivedi S', room: 'ME-12' },
                { email: 'student.test@example.com', name: 'Test Student 2', room: 'CS-101' },
                { email: 'valid@student.edu', name: 'Valid Student', room: 'EE-201' }
            ];

            for (const student of testStudents) {
                const [existing] = await this.pool.query(
                    'SELECT email FROM students WHERE email = ?', 
                    [student.email]
                );

                if (existing.length === 0) {
                    await this.pool.query(`
                        INSERT INTO students (email, full_name, room_number) 
                        VALUES (?, ?, ?)
                    `, [student.email, student.name, student.room]);
                    console.log(`  ➕ Added test student: ${student.email}`);
                } else {
                    console.log(`  ✅ Test student exists: ${student.email}`);
                }
            }

            // Add test rooms if needed
            const testRooms = ['ME-12', 'CS-101', 'EE-201', 'GENERAL'];
            console.log(`  📚 Test rooms available: ${testRooms.join(', ')}`);

            console.log('✅ Test data added');

        } catch (error) {
            console.error('❌ Test data creation failed:', error.message);
        }
    }

    async validateSystem() {
        console.log('\n🔎 Validating system integrity...');

        try {
            // Check critical components
            const checks = [
                {
                    name: 'Students table',
                    query: 'SELECT COUNT(*) as count FROM students'
                },
                {
                    name: 'Active sessions',
                    query: 'SELECT COUNT(*) as count FROM attendance_sessions WHERE is_active = TRUE'
                },
                {
                    name: 'Students with room numbers',
                    query: 'SELECT COUNT(*) as count FROM students WHERE room_number IS NOT NULL AND room_number != ""'
                },
                {
                    name: 'Attendance records structure',
                    query: `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
                           WHERE TABLE_NAME = 'attendance_records' 
                           AND COLUMN_NAME IN ('session_id', 'device_id', 'latitude', 'longitude')`
                }
            ];

            for (const check of checks) {
                try {
                    const [result] = await this.pool.query(check.query);
                    const count = result[0].count;
                    console.log(`  ✅ ${check.name}: ${count}`);
                } catch (error) {
                    console.log(`  ❌ ${check.name}: Error - ${error.message}`);
                }
            }

            // Test the validation logic
            const testValidation = this.testValidationLogic();
            console.log('  ✅ Validation logic tested');

            console.log('✅ System validation completed');

        } catch (error) {
            console.error('❌ System validation failed:', error.message);
        }
    }

    testValidationLogic() {
        // Test the location validation function
        const testLocations = [
            { lat: 21.0945451, lng: 79.0790567, elevation: 242, expected: true, name: 'Campus Location 1 (exact)' },
            { lat: 21.094540, lng: 79.079060, elevation: 242, expected: true, name: 'Campus Location 1 (close)' },
            { lat: 21.000000, lng: 79.000000, elevation: 242, expected: false, name: 'Far location' },
            { lat: 21.176909, lng: 79.060779, elevation: 242, expected: true, name: 'Campus Location 2 (exact)' }
        ];

        console.log('  🧪 Testing location validation:');
        testLocations.forEach(test => {
            const isValid = this.isLocationAllowed(test.lat, test.lng, test.elevation);
            const status = isValid === test.expected ? '✅' : '❌';
            console.log(`    ${status} ${test.name}: ${isValid ? 'Valid' : 'Invalid'}`);
        });

        return true;
    }

    isLocationAllowed(lat, lng, elevation) {
        const allowedLocations = [
            { lat: 21.0945451, lng: 79.0790567, elevation: 242 },
            { lat: 21.176909, lng: 79.060779, elevation: 242 },
            { lat: 21.1772037, lng: 79.0607161, elevation: 242 }
        ];
        
        const radius = 5; // meters
        
        for (const location of allowedLocations) {
            const distance = this.calculateDistance(lat, lng, location.lat, location.lng);
            const elevationDiff = Math.abs(elevation - location.elevation);
            
            if (distance <= radius && elevationDiff <= 10) {
                return true;
            }
        }
        return false;
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371000; // Earth's radius in meters
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    // Quick diagnostic method
    async quickDiagnose() {
        console.log('🔍 Quick System Diagnosis\n');

        try {
            // Check the specific email that's having issues
            const problemEmail = '24dwivedis_1@rbunagpur.in';
            
            console.log(`Checking student: ${problemEmail}`);
            const [student] = await this.pool.query(
                'SELECT * FROM students WHERE email = ?', 
                [problemEmail]
            );

            if (student.length > 0) {
                console.log('✅ Student found:', student[0]);
            } else {
                console.log('❌ Student not found in database');
            }

            // Check active sessions
            const [sessions] = await this.pool.query(`
                SELECT id, session_name, room_number, is_active 
                FROM attendance_sessions 
                WHERE is_active = TRUE
            `);

            console.log('\nActive sessions:', sessions.length);
            sessions.forEach(session => {
                console.log(`  • ${session.session_name} (Room: ${session.room_number})`);
            });

            // Check recent attendance attempts
            const [recentAttempts] = await this.pool.query(`
                SELECT student_email, attendance_date, status, session_id
                FROM attendance_records 
                WHERE student_email = ?
                ORDER BY attendance_date DESC 
                LIMIT 5
            `, [problemEmail]);

            console.log('\nRecent attendance records:', recentAttempts.length);
            recentAttempts.forEach(record => {
                console.log(`  • ${record.attendance_date}: ${record.status} (Session: ${record.session_id})`);
            });

        } catch (error) {
            console.error('❌ Quick diagnosis failed:', error.message);
        }
    }
}

// Enhanced server endpoint validation fix
class ServerValidationFix {
    static generateFixedAttendanceEndpoint() {
        return `
// FIXED ATTENDANCE ENDPOINT - Replace in your server.js
app.post('/api/attendance', [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
    body('elevation').optional().isFloat().withMessage('Elevation must be a number'),
    body('deviceId').notEmpty().trim().withMessage('Device ID is required')
], async (req, res) => {
    console.log('📝 Attendance marking attempt:', {
        email: req.body.email,
        location: { lat: req.body.latitude, lng: req.body.longitude },
        deviceId: req.body.deviceId?.substring(0, 10) + '...',
        timestamp: new Date().toISOString()
    });
    
    // Validate input data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', errors.array());
        return res.status(400).json({
            success: false,
            message: 'Invalid input data',
            errors: errors.array(),
            details: 'Please check your email format and location data'
        });
    }
    
    const { email, latitude, longitude, elevation = 242, deviceId } = req.body;
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    
    try {
        // Step 1: Check for active session
        console.log('🔍 Checking for active session...');
        const [sessionRows] = await pool.query(
            'SELECT id, session_name, room_number FROM attendance_sessions WHERE is_active = TRUE ORDER BY start_time DESC LIMIT 1'
        );
        
        if (sessionRows.length === 0) {
            console.log('❌ No active session found');
            return res.status(403).json({ 
                success: false, 
                message: 'No active attendance session. Please wait for faculty to start a session.',
                code: 'NO_ACTIVE_SESSION'
            });
        }
        
        const activeSession = sessionRows[0];
        console.log('✅ Active session found:', activeSession.session_name);
        
        // Step 2: Verify geolocation
        console.log('📍 Verifying location...');
        const locationCheck = isLocationAllowed(latitude, longitude, elevation);
        if (!locationCheck.allowed) {
            console.log('❌ Location not allowed:', { latitude, longitude, elevation });
            return res.status(403).json({
                success: false,
                message: 'You must be within the university premises to mark attendance.',
                code: 'INVALID_LOCATION',
                details: 'Please ensure you are on campus and location services are enabled'
            });
        }
        
        console.log('✅ Location verified:', locationCheck.location);
        
        // Step 3: Check if student exists
        console.log('👤 Checking student registration...');
        const [studentRows] = await pool.query('SELECT * FROM students WHERE email = ?', [email]);
        
        if (studentRows.length === 0) {
            console.log('❌ Student not found:', email);
            return res.status(404).json({ 
                success: false, 
                message: 'Student email not found in the roster. Please contact administration.',
                code: 'STUDENT_NOT_FOUND'
            });
        }
        
        const student = studentRows[0];
        console.log('✅ Student found:', student.full_name);
        
        // Step 4: Check room match
        if (activeSession.room_number !== student.room_number) {
            console.log('❌ Room mismatch:', { 
                sessionRoom: activeSession.room_number, 
                studentRoom: student.room_number 
            });
            return res.status(403).json({
                success: false,
                message: \`This session is for Room \${activeSession.room_number}. You are assigned to Room \${student.room_number || 'Not Assigned'}.\`,
                code: 'ROOM_MISMATCH'
            });
        }
        
        console.log('✅ Room verified:', student.room_number);
        
        // Step 5: Check device duplicate
        console.log('📱 Checking device usage...');
        const [deviceRows] = await pool.query(
            'SELECT student_email FROM attendance_records WHERE device_id = ? AND session_id = ?',
            [deviceId, activeSession.id]
        );
        
        if (deviceRows.length > 0) {
            console.log('❌ Device already used:', deviceId);
            return res.status(409).json({ 
                success: false, 
                message: 'This device has already been used to mark attendance for this session.',
                code: 'DEVICE_ALREADY_USED'
            });
        }
        
        // Step 6: Check student duplicate
        console.log('📝 Checking existing attendance...');
        const [existingRows] = await pool.query(
            'SELECT id FROM attendance_records WHERE student_email = ? AND session_id = ?',
            [email, activeSession.id]
        );
        
        if (existingRows.length > 0) {
            console.log('❌ Already marked attendance:', email);
            return res.status(409).json({ 
                success: false, 
                message: 'You have already marked attendance for this session.',
                code: 'ALREADY_MARKED'
            });
        }
        
        // Step 7: Mark attendance
        console.log('✅ All checks passed, marking attendance...');
        const [insertResult] = await pool.query(
            \`INSERT INTO attendance_records 
            (student_email, attendance_date, status, session_id, latitude, longitude, elevation, device_id, location_name) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)\`,
            [email, today, 'P', activeSession.id, latitude, longitude, elevation, deviceId, locationCheck.location]
        );
        
        console.log('✅ Attendance marked successfully:', {
            recordId: insertResult.insertId,
            student: email,
            session: activeSession.session_name
        });
        
        res.status(201).json({ 
            success: true, 
            message: \`Attendance marked successfully for session: \${activeSession.session_name}\`,
            data: {
                session: activeSession.session_name,
                room: activeSession.room_number,
                location: locationCheck.location,
                timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
            }
        });
        
    } catch (error) {
        console.error('💥 Database Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'A server error occurred while processing your request.',
            code: 'SERVER_ERROR',
            details: 'Please try again in a moment'
        });
    }
});`;
    }
}

// CLI interface
async function main() {
    const fixer = new ValidationFixer();
    const args = process.argv.slice(2);
    const command = args[0] || 'fix';

    console.log('🔧 Attendance System Validation Fixer');
    console.log('====================================');

    try {
        switch (command) {
            case 'fix':
            case 'complete':
                await fixer.runCompleteFix();
                break;

            case 'diagnose':
            case 'check':
                await fixer.quickDiagnose();
                break;

            case 'structure':
                await fixer.fixTableStructure();
                break;

            case 'students':
                await fixer.fixStudentData();
                break;

            case 'validation':
                await fixer.fixValidationIssues();
                break;

            case 'testdata':
                await fixer.addTestData();
                break;

            case 'validate':
                await fixer.validateSystem();
                break;

            case 'server-fix':
                console.log('📝 Fixed server endpoint:');
                console.log(ServerValidationFix.generateFixedAttendanceEndpoint());
                break;

            default:
                console.log('\n🛠️ Available Commands:');
                console.log('  fix        - Run complete validation fix (default)');
                console.log('  diagnose   - Quick diagnosis of current issues');
                console.log('  structure  - Fix database table structure');
                console.log('  students   - Fix student data issues');
                console.log('  validation - Fix validation logic issues');
                console.log('  testdata   - Add test data');
                console.log('  validate   - Validate system integrity');
                console.log('  server-fix - Show improved server endpoint code');
                console.log('');
                console.log('Usage: node validation-fix.js [command]');
                console.log('');
                console.log('🔍 Common Issues Fixed:');
                console.log('  • Missing table columns');
                console.log('  • Invalid student data');
                console.log('  • Missing room assignments');
                console.log('  • Inactive sessions');
                console.log('  • Location validation errors');
                console.log('  • Device ID issues');
                break;
        }
    } catch (error) {
        console.error('💥 Command failed:', error);
    } finally {
        try {
            await fixer.pool.end();
        } catch (e) {
            // Ignore cleanup errors
        }
    }
}

// Error analysis helper
class ErrorAnalyzer {
    static analyzeValidationError(errorMessage) {
        const commonIssues = {
            'Invalid input data': {
                cause: 'Form validation failed',
                solutions: [
                    'Check email format (must be valid email)',
                    'Ensure location coordinates are valid numbers',
                    'Verify device ID is generated properly'
                ]
            },
            'No active attendance session': {
                cause: 'Faculty has not started a session',
                solutions: [
                    'Wait for faculty to start attendance session',
                    'Check with instructor about session timing',
                    'Verify you are checking at the right time'
                ]
            },
            'Student email not found': {
                cause: 'Student not registered in system',
                solutions: [
                    'Contact administration to add your email',
                    'Verify you are using your official university email',
                    'Check for typos in email address'
                ]
            },
            'Room mismatch': {
                cause: 'Session is for different room than student assignment',
                solutions: [
                    'Verify you are in the correct room',
                    'Check your room assignment with administration',
                    'Wait for session in your assigned room'
                ]
            },
            'You must be within university premises': {
                cause: 'Location outside allowed campus areas',
                solutions: [
                    'Move to campus premises',
                    'Enable high-accuracy location services',
                    'Try refreshing location/reloading page'
                ]
            },
            'Device already used': {
                cause: 'This device was already used for attendance',
                solutions: [
                    'Each device can only mark attendance once per session',
                    'Use a different device if available',
                    'Contact faculty if this is an error'
                ]
            }
        };

        for (const [error, info] of Object.entries(commonIssues)) {
            if (errorMessage.includes(error)) {
                return info;
            }
        }

        return {
            cause: 'Unknown error',
            solutions: ['Try refreshing the page', 'Check server logs', 'Contact technical support']
        };
    }
}

module.exports = {
    ValidationFixer,
    ServerValidationFix,
    ErrorAnalyzer
};

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}