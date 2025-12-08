// 1. Modal Toggle
function toggleModal(show) {
    const modal = document.getElementById('create-modal');
    if (show) {
        modal.classList.remove('hidden');
        // Set default times for convenience (Now -> +1 Hour)
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

        // Helper to format for datetime-local (YYYY-MM-DDTHH:MM)
        const format = (d) => d.toISOString().slice(0, 16);
    } else {
        modal.classList.add('hidden');
    }
}

// 2. Submit Event to Backend
document.getElementById('createEvent').addEventListener('submit', submitEventToBackend);
async function submitEventToBackend(e) {
    e.preventDefault();

    const name = document.getElementById('event-name').value;
    const date = document.getElementById('date').value;
    const start = document.getElementById('start-time').value;
    const end = document.getElementById('end-time').value;

    try {
        const response = await fetch('/api/create-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name, date: date, start_time: start, end_time: end })
        });

        if (response.ok) {
            toggleModal(false);
            checkActiveEvent();
            alert("Event Scheduled!");
            loadEvents();
        } else {
            alert("Error creating event");
        }
    } catch (error) {
        console.error("Connection Error", error);
    }
}

// Auto Refresh 
setInterval(() => {
    checkActiveEvent()
}, 5000);

async function checkActiveEvent(e) {
    const card = document.getElementById('card-details');

    try {
        const response = await fetch('/api/status');
        const data = await response.json();

        if (data.active) {
            card.innerHTML = `
                        <div class="absolute top-4 right-4 flex items-center gap-1 bg-red-50 px-2 py-1 rounded-full border border-red-100">
                            <span class="relative flex h-2 w-2">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            <span class="text-[10px] font-bold text-red-500 tracking-wide">LIVE</span>
                        </div>

                        <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Happening Now</p>
                        <h2 class="text-2xl font-bold text-slate-800 mb-4">${data.name}</h2>
                        
                        <div class="flex items-center gap-6 mb-6">
                            <div>
                                <p class="text-xs text-slate-400 font-semibold">Attendees</p>
                                <p class="text-xl font-bold text-emerald-600">${data.count}</p>
                            </div>
                            <div>
                                <p class="text-xs text-slate-400 font-semibold">Time</p>
                                <p class="text-xl font-bold text-slate-700">${data.start} - ${data.end}</p>
                            </div>
                        </div>

                        <button onclick="window.location.href='/kiosk'" class="w-full bg-emerald-600 active:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-md flex justify-center items-center gap-2 transition-transform active:scale-[0.98]">
                            Resume Scanning <span class="material-icons-round text-lg">arrow_forward</span>
                        </button>
                    `;
        } else {
            // RENDER "NO EVENT" STATE
            card.innerHTML = `
                         <div class="text-center py-2 w-full">
                            <div class="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                                <span class="material-icons-round text-2xl">event_busy</span>
                            </div>
                            <p class="text-slate-400 font-bold text-sm">No Active Event</p>
                            <p class="text-xs text-slate-400 mb-3">Schedule a session to start scanning.</p>
                            <button onclick="toggleModal(true)" class="text-emerald-600 text-xs font-bold uppercase tracking-wide border border-emerald-100 px-3 py-1 rounded-full bg-emerald-50">Create Now</button>
                         </div>
                    `;
        }
    } catch (error) {
        console.error("Could not fetch status", error);
        card.innerHTML = `<p class="text-red-400 text-xs text-center">Connection Error</p>`;
    }
}

async function loadEvents() {
    const list = document.getElementById('history-list');
    list.innerHTML = ""

    try {
        const response = await fetch('/api/events');
        const data = await response.json();

        if (data) {
            data.forEach(d => {
                list.innerHTML += `
                        <div
                            class="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <div class="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                    <span class="material-icons-round text-lg">event</span>
                                </div>
                                <div>
                                    <p class="font-bold text-slate-700 text-sm">${d.name}</p>
                                    <p class="text-xs text-slate-400">${d.date} • ${d.time}</p>
                                </div>
                            </div>
                            <button class="p-2 text-slate-300 hover:text-emerald-600">
                                <span class="material-icons-round">chevron_right</span>
                            </button>
                        </div>
                        `;  
            });

        } else {
            list.innerHTML = `
                            <p class="text-slate-400 font-bold text-sm text-center m-4">No Records Found</p>
                    `;
        }
    } catch (error) {
        console.error("Could not fetch status", error);
        card.innerHTML = `<p class="text-red-400 text-xs text-center">Connection Error</p>`;
    }
}

// Initialize on Load
document.addEventListener('DOMContentLoaded', checkActiveEvent, loadEvents());
