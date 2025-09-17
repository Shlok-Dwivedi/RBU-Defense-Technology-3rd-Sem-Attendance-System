# RBU-Defense-Technology-3rd-Sem-Attendance-System

A modern **session-based attendance management system** designed for universities and colleges.  
This project provides a simple, intuitive **frontend interface** for students to mark their attendance and for faculty to manage sessions and view summaries.  

---

## ✨ Features  

### 👩‍🎓 Students  
- ✅ **Session-Based Marking** – Students can only mark attendance when a faculty member has started an active session.  
- 🔄 **Real-Time Status Updates** – The page automatically checks for active sessions and updates its status.  
- 🏫 **Room Validation** – Attendance can be restricted to specific rooms/labs.  
- 🚫 **Duplicate Prevention** – A student can mark attendance only once per session.  
- 🎨 **Clean & Modern UI** – Simple, professional interface for quick marking.  

### 👨‍🏫 Faculty  
- 🕒 **Session Management**  
  - Start and end sessions with a custom name and optional room number.  
  - Maintain a log of past sessions (with start/end times and total attendees).  
- 📊 **Attendance Dashboard**  
  - View summary of attendance with filters (by room or date).  
  - Auto-calculated percentages for each student.  
- 👥 **Student Roster Management**  
  - Add, edit, or remove student records.  
  - View complete list of registered students.  

---

## 🛠️ Tech Stack  
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla JS)  
- **Hosting:** GitHub Pages  

---

## 📂 Project Structure  
```bash
.
├── index.html        # Student attendance page
├── faculty.html      # Faculty dashboard
├── faculty.js        # Faculty-side logic
├── styles.css        # Shared stylesheet
└── README.md         # Project documentation


