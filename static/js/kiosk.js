// 2. Simulate Attendance Entry
function simulateAttendance() {
    const input = document.getElementById('manual-input');
    const list = document.getElementById('attendee-list');
    const counter = document.getElementById('counter');

    // Mock Data
    const id = input.value || "2023-XXXXX";
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Create List Item HTML
    const newItem = `
        <li class="bg-white p-3 rounded-xl shadow-sm border border-l-4 border-l-emerald-500 flex items-center justify-between animate-pulse">
            <div class="flex items-center gap-3">
                <div class="h-10 w-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    <span class="material-icons-round text-sm">check</span>
                </div>
                <div>
                    <p class="font-bold text-slate-700 text-sm">New Student</p>
                    <p class="text-xs text-slate-400">${id} • BSCS</p>
                </div>
            </div>
            <span class="text-xs font-mono text-slate-400">${time}</span>
        </li>
    `;

    // Insert at top
    list.insertAdjacentHTML('afterbegin', newItem);

    // Update Counter
    let currentCount = parseInt(counter.innerText);
    counter.innerText = currentCount + 1;

    // Clear Inputs
    input.value = "";

    // Remove pulse animation after a moment
    setTimeout(() => {
        const item = list.firstElementChild;
        item.classList.remove('animate-pulse');
    }, 1000);
}

// 3. Simulate Scanner "Hit" (Automatic Trigger for demo)
// In real app, this is triggered by the QR library
setTimeout(() => {
    // simulateAttendance(); // Uncomment to test auto-add on load
}, 2000);

document.addEventListener("DOMContentLoaded", () => {
    const html5QrCode = new Html5Qrcode("reader");
    const statusMsg = document.getElementById("status-msg");

    // Create a beep sound
    const beep = new Audio("/static/sounds/beep.mp3"); // put your beep file here

    const config = { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0 
    };

    // Start Camera
    html5QrCode.start(
        { facingMode: "environment" }, // Use back camera
        config,
        (decodedText, decodedResult) => {
            // SUCCESS
            console.log(`Code matched = ${decodedText}`, decodedResult);
            statusMsg.className = "text-center text-xs text-green-500 mt-2";
            statusMsg.innerText = "Success: " + decodedText;

            // Play beep on success, ignore play errors
            beep.play().catch(() => {});

            // Optional: Stop scanning
            // html5QrCode.stop();
        },
        (errorMessage) => {
            // Scanning... (This runs constantly while scanning, usually ignore)
        }
    ).catch((err) => {
        // Camera start failed
        console.error(err);
        statusMsg.innerText = "Error starting camera";
    });
});