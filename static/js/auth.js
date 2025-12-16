// --- TAB SWITCHING LOGIC ---
function switchTab(role) {
    const officerBtn = document.getElementById('tab-officer');
    const studentBtn = document.getElementById('tab-student');
    const officerView = document.getElementById('view-officer');
    const studentView = document.getElementById('view-student');
    const errorMsg = document.getElementById('error-msg');

    // Reset Error
    errorMsg.classList.remove('opacity-100');
    errorMsg.classList.add('opacity-0');

    if (role === 'officer') {
        // Style Buttons
        officerBtn.className = "flex-1 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm bg-white text-emerald-700";
        studentBtn.className = "flex-1 py-2.5 rounded-full text-sm font-bold text-slate-400 hover:text-slate-600 transition-all";
        
        // Show View
        studentView.classList.remove('fade-enter-active');
        studentView.classList.add('hidden-tab');
        
        officerView.classList.remove('hidden-tab');
        // Small delay to trigger animation
        setTimeout(() => officerView.classList.add('fade-enter-active'), 10);

    } else {
        // Style Buttons
        studentBtn.className = "flex-1 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm bg-white text-emerald-700";
        officerBtn.className = "flex-1 py-2.5 rounded-full text-sm font-bold text-slate-400 hover:text-slate-600 transition-all";

        // Show View
        officerView.classList.remove('fade-enter-active');
        officerView.classList.add('hidden-tab');

        studentView.classList.remove('hidden-tab');
        setTimeout(() => studentView.classList.add('fade-enter-active'), 10);
    }
}

async function handleLogin() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    const errorMsg = document.getElementById('error-msg');

    try {
        const res = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pass }),
        });

        const data = await res.json();

        if (!res.ok) {
            // console.warn(data.error || 'Login failed!');
            // alert(data.error || 'Invalid ID or password.');
            errorMsg.classList.remove('opacity-0');
            errorMsg.classList.add('opacity-100');
            
            // Shake the inputs (simple CSS manipulation)
            const inputs = document.querySelectorAll('input');
            inputs.forEach(input => {
                input.classList.add('ring-2', 'ring-rose-200');
                setTimeout(() => input.classList.remove('ring-2', 'ring-rose-200'), 500);
            });
            return;
        }

        window.location.href = '/dashboard';
    } catch (err) {
        console.error('Login error:', err);
    }
}