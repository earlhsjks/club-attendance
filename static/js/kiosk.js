const html5QrCode = new Html5Qrcode("reader");
const statusMsg = document.getElementById("status-msg");
const beep = new Audio("/static/sounds/beep.mp3");
const config = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };
let isTransitioning = false;

// Make switchTab global
function switchTab(mode) {
    const viewScan = document.getElementById('view-scan');
    const viewManual = document.getElementById('view-manual');
    const btnScan = document.getElementById('btn-scan');
    const btnManual = document.getElementById('btn-manual');

    if (mode === 'scan') {
        viewScan.style.display = 'block';
        viewManual.style.display = 'none';
        safeStartScanner();

        btnScan.classList.add('bg-white', 'text-emerald-700', 'shadow-sm');
        btnScan.classList.remove('text-slate-500');
        btnManual.classList.remove('bg-white', 'text-emerald-700', 'shadow-sm');
        btnManual.classList.add('text-slate-500');

    } else {
        viewScan.style.display = 'none';
        viewManual.style.display = 'block';
        safeStopScanner();

        btnManual.classList.add('bg-white', 'text-emerald-700', 'shadow-sm');
        btnManual.classList.remove('text-slate-500');
        btnScan.classList.remove('bg-white', 'text-emerald-700', 'shadow-sm');
        btnScan.classList.add('text-slate-500');
    }
}

async function safeStopScanner() {
    if (isTransitioning) return;
    isTransitioning = true;
    try { await html5QrCode.stop(); } catch(e) {}
    isTransitioning = false;
}

async function safeStartScanner() {
    if (isTransitioning) return;
    isTransitioning = true;
    try {
        await html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, onScanFailure);
    } catch(e) {
        console.error("Scanner failed to start:", e);
        statusMsg.innerText = "Camera failed to start";
    }
    isTransitioning = false;
}

document.addEventListener("DOMContentLoaded", () => {
    function restartScanner(delay=2000) {
        setTimeout(() => {
            html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, onScanFailure)
            .catch(err => console.log("Scanner restart failed:", err));
        }, delay);
    }

    window.manualEntry = function() {
        const input = document.getElementById('manual-input');
        if (!input || !input.value.trim()) return;
        onScanSuccess(input.value.trim(), null);
    };

    function onScanSuccess(decodedText, decodedResult) {
        const studentBarcode = decodedText;
        html5QrCode.stop().catch(() => {});

        fetch('/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_id: studentBarcode })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                beep.play().catch(() => {});
                statusMsg.className = "text-center text-xs text-green-500 mt-2";
                statusMsg.innerText = data.message;
                loadHistory();
                restartScanner(1500);
            } else {
                statusMsg.className = "text-center text-xs text-red-500 mt-2";
                statusMsg.innerText = data.message;
                shakeStatus(data.message);
                restartScanner(2500);
            }
        })
        .catch(err => {
            console.error("Network error", err);
            restartScanner(2000);
        });
    }

    function onScanFailure(errorMessage) {
        // ignore scan fail
    }

    html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, onScanFailure)
    .catch(err => {
        console.log(err);
        statusMsg.innerText = "Camera failed to start";
    });

    checkActiveEvent();
    loadHistory();
});

// Fetch current event status
async function checkActiveEvent() {
    const currentEvent = document.getElementById('currentEvent');
    const counter = document.getElementById('counter');

    try {
        const res = await fetch('/api/status');
        const data = await res.json();

        if (data.active) {
            currentEvent.innerText = data.name;
            counter.innerText = data.count;
        } else {
            currentEvent.innerText = "No Active Event";
            counter.innerText = 0;
        }
    } catch (err) {
        console.error("Status fetch failed", err);
        counter.innerHTML = `<p class="text-red-400 text-xs text-center">Connection Error</p>`;
    }
}

async function loadHistory() {
    try {
        const res = await fetch('/api/attendees');
        if (!res.ok) return console.error('Error fetching attendees', res.status);

        const data = await res.json();

        const students = data?.students || []; // <-- safe fallback
        const list = document.getElementById('attendee-list');
        const noRecords = document.getElementById('no-records');

        list.innerHTML = "";

        if (students.length === 0) {
            noRecords.style.display = 'block';
            return;
        } else {
            noRecords.style.display = 'none';
        }

        // Only show last 20 recent scans
        const recent = students.slice(-20).reverse();

        recent.forEach(s => {
            const li = document.createElement('li');
            li.className = "bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between";
            li.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-sm">
                        ${s.name[0]}
                    </div>
                    <div>
                        <p class="font-bold text-slate-700 text-sm">${s.name || 'Unknown'}</p>
                        <p class="text-xs text-slate-400">${s.student_id || ''} • ${s.course || ''} ${s.year || ''}</p>
                    </div>
                </div>
                <span class="text-xs font-mono text-slate-400">${s.time || ''}</span>
            `;
            list.appendChild(li);
        });

    } catch (err) {
        console.error("Could not load attendees", err);
    }
}

// Shake feedback for failed scans
function shakeStatus(msg) {
    const statusMsg = document.getElementById('status-msg');
    statusMsg.innerText = msg;
    statusMsg.className = "text-center text-xs text-red-500 mt-2 shake";

    // Remove shake class after animation
    setTimeout(() => statusMsg.classList.remove('shake'), 400);
}

setInterval(() => {
    checkActiveEvent();
    loadHistory();
}, 5000);