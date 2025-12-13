async function loadAttendees() {
    const eventId = document.getElementById('eventId').value;
    const list = document.getElementById('attendee-list');
    const eof = document.getElementById('eof');
    const total = document.getElementById('total');
    const timeS = document.getElementById('timeStarted');

    // Clear list
    list.innerHTML = "";
    eof.style.display = 'none';
    total.innerText = 0;
    timeS.innerText = "";

    try {
        const res = await fetch(`/api/attendees?selected=${eventId}`);
        if (!res.ok) throw new Error("Failed to fetch attendees");

        const data = await res.json();
        const students = data?.students || [];
        const totalCount = data?.total || 0;
        const time = data?.time_start || "";

        total.innerText = totalCount;
        timeS.innerText = time;

        if (students.length === 0) {
            eof.style.display = 'block';
            eof.innerText = "No records yet";
            return;
        } else {
            eof.style.display = 'none';
        }

        // Use DocumentFragment for better performance
        const fragment = document.createDocumentFragment();

        students.forEach(s => {
            const div = document.createElement('div');
            div.className = "student bg-white p-4 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100 flex items-center justify-between group";
            div.innerHTML = `
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
                    <span class="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md mb-1">${s.timestamp}</span>
                </div>
            `;
            fragment.appendChild(div);
        });

        list.appendChild(fragment);

    } catch (err) {
        console.error("Could not load attendees", err);
        eof.style.display = 'block';
        eof.innerText = "Error loading attendees";
    }
}

const searchBox = document.getElementById('searchBox');
const studentList = document.getElementById('attendee-list');

searchBox.addEventListener('input', () => {
    const query = searchBox.value.toLowerCase().trim();
    
    const items = studentList.querySelectorAll('.student');

    items.forEach(item => {
        const text = item.innerText.toLowerCase();
        item.style.display = text.includes(query) ? 'flex' : 'none';
    });
});

async function downloadCSV(eventId, name, date) {
    const res = await fetch(`/api/export?event_id=${eventId}`);

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Download failed');
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${name} ${date}`
    document.body.appendChild(a);
    a.click();

    a.remove();
    window.URL.revokeObjectURL(url);
}

// Initialize on Load
window.addEventListener("load", async () => {
    await loadAttendees();

    document.getElementById("app").classList.remove("opacity-0");
    document.getElementById("app").classList.add("opacity-100");
});
