async function loadAttendees() {
    eventId = document.getElementById('eventId').value;
    try {
        const res = await fetch(`/api/attendees?selected=${eventId}`);
        if (!res.ok) return;

        const data = await res.json();
        const students = data?.students || [];
        const totalCount = data?.total || [];
        const time = data?.time || [];
        const list = document.getElementById('attendee-list');
        const eof = document.getElementById('eof');
        const total = document.getElementById('total');
        let timeS = document.getElementById('timeStarted')

        list.innerHTML = "";

        if (students.length === 0) {
            eof.style.display = 'block';
            eof.innerText = "No records yet"
            total.innerText = 0;
            timeS.innerText = time;
            return;
        } else {
            eof.style.display = 'block';
            total.innerText = totalCount;
            timeS.innerText = time;
        }

        students.forEach(s => {
            list.innerHTML += `
                        <div class="bg-white p-4 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100 flex items-center justify-between group">
                            <div class="flex items-center gap-3">
                                <div class="relative">
                                    <div class="h-9 w-9 min-h-[36px] min-w-[36px] max-h-[36px] max-w-[36px] bg-emerald-100 rounded-full flex items-center justify-center text-emerald-500 font-bold text-xs">
                                        ${s.name[0]}
                                    </div>
                                    <div hidden class="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 border border-slate-100">
                                        <span class="material-icons-round text-emerald-500 text-xs">check_circle</span>
                                    </div>
                                </div>
                                <div>
                                    <h3 class="font-bold text-slate-700 text-sm">${s.name}</h3>
                                    <p class="text-xs text-slate-400 font-mono">${s.student_id} • ${s.course} ${s.year}</p>
                                </div>
                            </div>
                            <div class="text-right flex flex-col items-end">
                                <span class="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md mb-1">12:04pm</span>
                                <!-- <button class="text-rose-400 text-[10px] font-bold hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity">REMOVE</button> -->
                            </div>
                        </div>
            `;
        });

    } catch (err) {
        console.error("Could not load attendees", err);
    }

    await new Promise(r => setTimeout(r, 100));
}

// Initialize on Load
window.addEventListener("load", async () => {
    await loadAttendees();

    document.getElementById("app").classList.remove("opacity-0");
    document.getElementById("app").classList.add("opacity-100");
});
