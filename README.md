# RBU-Defense-Technology-3rd-Sem-Attendance-System

A modern, session-based attendance management system designed for universities and colleges. This application provides a simple interface for students to mark their attendance and a comprehensive dashboard for faculty to manage sessions, students, and view detailed attendance analytics.

✨ Features
For Students
Session-Based Marking: Students can only mark attendance when a faculty member has started an active session.

Real-time Status Updates: The student page automatically checks for active sessions and updates its status, enabling or disabling the submission form.

Room Number Validation: If a session is started for a specific room, only students assigned to that room can mark their attendance.

Prevents Duplicates: A student can only mark their attendance once per session.

Clean & Simple UI: A straightforward interface for quick and easy attendance marking.

For Faculty
Secure Authentication: Faculty members have individual accounts and must log in to access the dashboard.

Session Management:

Start Sessions: Faculty can start new attendance sessions with a custom name and an optional room number.

End Sessions: Actively end sessions to close attendance marking.

View All Sessions: A historical log of all past sessions, including start/end times and the number of attendees.

Attendance Summary Dashboard:

View a comprehensive summary of student attendance.

Filter by Room Number: Easily view attendance for specific classes or labs.

Filter by Date: Narrow down records to a single day.

Calculated Percentages: Automatically calculates and displays the attendance percentage for each student based on the applied filters.

Student Roster Management:

View a complete list of all registered students.

Add New Students: Easily add new students to the roster.

Edit Student Details: Update a student's name or room number.

Delete Students: Remove students from the roster.

🛠️ Tech Stack
Frontend: HTML5, CSS3, JavaScript (Vanilla JS)

Backend: Node.js, Express.js

Database: MySQL

Authentication: JSON Web Tokens (JWT) for session management

Deployment:

Frontend hosted on GitHub Pages.

Backend and Database hosted on Railway (or a similar service like Render).

📁 Project Structure
.
├── credentials.env       # Secret database URL (MUST NOT be committed to Git)
├── package.json
├── server.js             # The core backend logic
├── sessions.js           # One-time script to set up database tables for sessions
├── faculty.html          # Faculty login and dashboard page
├── faculty.js            # Logic for the faculty dashboard
├── index.html            # Student attendance form
├── script.js             # Logic for the student form
└── styles.css            # Shared stylesheet


⚙️ Setup and Local Installation
To run this project on your local machine, follow these steps.

Prerequisites
Node.js (which includes npm) installed.

A MySQL client like TablePlus or DBeaver to manage the database.

1. Database Setup
Create a free MySQL database on a service like Railway.

Connect to your database using your MySQL client.

Run the appropriate SQL commands to create the initial students and faculty tables.

Run the sample INSERT query to add a default faculty member so you can log in.

2. Frontend Usage
Simply open the index.html (for students) or faculty.html (for faculty) file in your web browser. The files are already configured to communicate with your local backend.

This project was developed for educational purposes.
