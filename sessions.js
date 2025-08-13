// setup-sessions.js - Run this script to add session functionality to your database

require('dotenv').config({ path: './credentials.env' });
const mysql = require('mysql2/promise');

async function setupSessions() {
    let connection;
    
    try {
        console.log('🔗 Connecting to database...');
        connection = await mysql.createConnection({
            uri: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
        
        console.log('✅ Connected to database');
        
        // Create attendance_sessions table
        console.log('📋 Creating attendance_sessions table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS attendance_sessions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                session_name VARCHAR(255) NOT NULL,
                room_number VARCHAR(50),
                started_by VARCHAR(255) NOT NULL,
                start_time DATETIME NOT NULL,
                end_time DATETIME NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_active_sessions (is_active, start_time),
                INDEX idx_room_sessions (room_number, is_active)
            )
        `);
        
        console.log('✅ attendance_sessions table created');
        
        // Check if session_id column exists in attendance_records
        console.log('🔍 Checking attendance_records table structure...');
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'attendance_records' 
            AND COLUMN_NAME = 'session_id'
        `);
        
        if (columns.length === 0) {
            console.log('➕ Adding session_id column to attendance_records...');
            await connection.execute(`
                ALTER TABLE attendance_records 
                ADD COLUMN session_id INT NULL,
                ADD FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE SET NULL
            `);
            
            console.log('✅ session_id column added');
            
            // Create index for better performance
            await connection.execute(`
                CREATE INDEX idx_attendance_session ON attendance_records(session_id)
            `);
            
            console.log('✅ Index created for session_id');
        } else {
            console.log('ℹ️ session_id column already exists');
        }
        
        console.log('🎉 Session functionality setup completed successfully!');
        console.log('');
        console.log('📋 Next steps:');
        console.log('1. Restart your server: node server.js');
        console.log('2. Go to http://localhost:3000 to access the faculty dashboard');
        console.log('3. Login with your faculty credentials');
        console.log('4. Use the new "Attendance Sessions" tab to start sessions');
        console.log('5. Students can now only mark attendance when a session is active');
        
    } catch (error) {
        console.error('💥 Setup failed:', error);
        console.log('');
        console.log('❌ Please check:');
        console.log('1. Your database connection in credentials.env');
        console.log('2. Database permissions');
        console.log('3. Run: npm install mysql2 (if not already installed)');
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔗 Database connection closed');
        }
    }
}

// Run the setup
setupSessions();