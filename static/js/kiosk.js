const html5QrCode = new Html5Qrcode("reader");
const statusMsg = document.querySelectorAll("#status-msg");
const listTotal = document.getElementById('total-list');
const beep = new Audio("/static/sounds/beep.mp3");
const config = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };

// State flags
let isTransitioning = false;
let isProcessing = false;

function handleScanLogic(studentBarcode) {
    if (isProcessing) return;

    isProcessing = true;

    statusMsg.forEach(e => e.innerText = "Processing...");
    statusMsg.forEach(e => e.className = "text-center text-sm text-blue-500 mt-2");

    fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentBarcode })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            beep.play().catch(() => {});
            statusMsg.forEach(e => e.className = "text-center text-sm text-green-500 mt-2");
            statusMsg.forEach(e => e.innerText = data.message);   // FIXED TYPO
            loadHistory();
        } else {
            shakeStatus(data.message);
        }
    })
    .catch(err => {
        console.error("Network error", err);
        statusMsg.forEach(e => e.className = "text-center text-sm text-red-500 mt-2");
        statusMsg.forEach(e => e.innerText = "Network Error");
    })
    .finally(() => {
        setTimeout(() => {
            isProcessing = false;

            // FIXED NodeList classList check
            if ([...statusMsg].some(e => e.classList.contains('text-green-500'))) {
                statusMsg.forEach(e => e.innerText = "Ready to scan/record");
                statusMsg.forEach(e => e.className = "text-center text-sm text-slate-400 mt-2");
            }
        }, 2000);
    });
}

function onScanSuccess(decodedText, decodedResult) {
    handleScanLogic(decodedText);
}

function onScanFailure(errorMessage) {}

// Shake animation
function shakeStatus(msg) {
    statusMsg.forEach(e => e.innerText = msg);
    statusMsg.forEach(e => e.className = "text-center text-sm text-red-500 mt-2 shake");
    
    // FIXED timeout syntax
    setTimeout(() => {
        statusMsg.forEach(e => e.classList.remove('shake'));
    }, 400);
}

async function safeStartScanner() {
    if (isTransitioning) return;
    
    try {
        isTransitioning = true;

        // Get available cameras
        const devices = await Html5Qrcode.getCameras();

        if (!devices || !devices.length) {
            throw new Error("No cameras found");
        }

        // Pick the back camera (not front, not ultra-wide if possible)
        // You may refine this by checking labels for "back" and avoiding "wide" keywords
        const backCamera = devices.find(d => 
            d.label.toLowerCase().includes("back") &&
            !d.label.toLowerCase().includes("wide")
        ) || devices[0]; // fallback to first camera

        await html5QrCode.start(
            { deviceId: { exact: backCamera.id } },
            config,
            onScanSuccess,
            onScanFailure
        );

        statusMsg.forEach(e => e.innerText = "Ready to scan");
        statusMsg.forEach(e => e.className = "text-center text-sm text-slate-400 mt-2");

    } catch(e) {
        if (e?.name !== "Html5QrcodeError") {
            console.error("Scanner failed to start:", e);
            statusMsg.forEach(e => e.innerText = "Camera failed to start");
        }
    }

    isTransitioning = false;
}

async function safeStopScanner() {
    if (isTransitioning) return;
    
    try {
        if (html5QrCode.isScanning) {
            isTransitioning = true;
            await html5QrCode.stop();
        }
    } catch(e) {
        console.error("Error stopping scanner", e);
    }
    isTransitioning = false;
}

window.switchTab = function(mode) {
    const viewScan = document.getElementById('view-scan');
    const viewManual = document.getElementById('view-manual');
    const btnScan = document.getElementById('btn-scan');
    const btnManual = document.getElementById('btn-manual');

    if (mode === 'scan') {
        viewScan.style.display = 'block';
        viewManual.style.display = 'none';
        
        btnScan.classList.add('bg-white', 'text-emerald-700', 'shadow-sm');
        btnScan.classList.remove('text-slate-500');
        btnManual.classList.remove('bg-white', 'text-emerald-700', 'shadow-sm');
        btnManual.classList.add('text-slate-500');

        safeStartScanner();
    } else {
        viewScan.style.display = 'none';
        viewManual.style.display = 'block';
        
        btnManual.classList.add('bg-white', 'text-emerald-700', 'shadow-sm');
        btnManual.classList.remove('text-slate-500');
        btnScan.classList.remove('bg-white', 'text-emerald-700', 'shadow-sm');
        btnScan.classList.add('text-slate-500');

        safeStopScanner();
    }
};

window.manualEntry = function() {
    const input = document.getElementById('manual-input');
    if (!input || !input.value.trim()) return;
    
    handleScanLogic(input.value.trim());
    input.value = ""; 
};

async function checkActiveEvent() {
    const currentEvent = document.getElementById('currentEvent');
    const counter = document.getElementById('counter');
    
    try {
        const res = await fetch('/api/status');
        const data = await res.json();

        if (data.active) {
            currentEvent.innerText = data.name;
            counter.innerText = data.count;
            listTotal.innerHTML = `SHOWING 20 OF ${data.count}`;
        } else {
            currentEvent.innerText = "No Active Event";
            counter.innerText = 0;
            listTotal.innerText = ""
        }
    } catch (err) {
        console.error("Status fetch failed", err);
    }
}

async function loadHistory() {
    try {
        const res = await fetch('/api/attendees');
        if (!res.ok) return;

        const data = await res.json();
        const students = data?.students || [];
        const list = document.getElementById('attendee-list');
        const noRecords = document.getElementById('no-records');

        list.innerHTML = "";

        if (students.length === 0) {
            noRecords.style.display = 'block';
            listTotal.style.display = 'none'
            return;
        } else {
            noRecords.style.display = 'none';
            listTotal.style.display = 'block'
        }

        const recent = students.slice(-20).reverse();

        recent.forEach(s => {
            const li = document.createElement('li');
            li.className = "bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between";
            li.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="h-9 w-9 min-h-[36px] min-w-[36px] max-h-[36px] max-w-[36px] bg-emerald-100 rounded-full flex items-center justify-center text-emerald-500 font-bold text-xs">
                        ${s.name ? s.name[0] : '?'}
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

setInterval(() => {
    checkActiveEvent();
    loadHistory();
}, 5000);

// Initialize on Load
window.addEventListener("DOMContentLoaded", async () => {
    await checkActiveEvent(); 
    await loadHistory(); 
    
    await document.getElementById("skeleton").classList.add("hidden");
    await document.getElementById("main").classList.remove("hidden");

    safeStartScanner();
});
