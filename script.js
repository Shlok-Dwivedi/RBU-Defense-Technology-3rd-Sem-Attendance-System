document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('attendance-form');
    const messageDiv = document.getElementById('message');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const spinner = submitBtn.querySelector('.spinner');

    const API_URL = 'http://localhost:3000/api/attendance';

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        setLoading(true);
        showMessage('', '');

        const email = form.email.value.trim();

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email })
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                showMessage(result.message || 'Attendance marked successfully!', 'success');
                form.reset();
            } else {
                showMessage(result.message || 'An error occurred.', 'error');
            }
        } catch (error) {
            console.error('Attendance submission error:', error);
            showMessage('Could not connect to the server. Please check if the server is running.', 'error');
        } finally {
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        submitBtn.disabled = isLoading;
        btnText.style.display = isLoading ? 'none' : 'inline-block';
        spinner.style.display = isLoading ? 'inline-block' : 'none';
        
        if (isLoading) {
            btnText.textContent = 'Marking...';
        } else {
            btnText.textContent = 'Mark Present';
        }
    }
    
    function showMessage(msg, type) {
        if (msg) {
            messageDiv.textContent = msg;
            messageDiv.className = `message ${type}`;
            messageDiv.style.display = 'block';
            
            // Auto-hide success messages after 5 seconds
            if (type === 'success') {
                setTimeout(() => {
                    messageDiv.style.display = 'none';
                }, 5000);
            }
        } else {
            messageDiv.style.display = 'none';
        }
    }
});