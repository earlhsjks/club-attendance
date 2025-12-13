function switchTab(mode) {
    const viewStudents = document.getElementById('view-students');
    const viewReports = document.getElementById('view-reports');
    const btnStudents = document.getElementById('btn-students');
    const btnReports = document.getElementById('btn-reports');

    if (mode === 'students') {
        viewStudents.style.display = 'block';
        viewReports.style.display = 'none';
        
        btnStudents.className = "flex-1 py-2 rounded-lg text-sm font-semibold shadow-sm bg-white text-emerald-700 transition-all flex justify-center items-center gap-2";
        btnReports.className = "flex-1 py-2 rounded-lg text-sm font-semibold text-slate-500 hover:text-slate-700 transition-all flex justify-center items-center gap-2";
    } else {
        viewStudents.style.display = 'none';
        viewReports.style.display = 'block';

        btnReports.className = "flex-1 py-2 rounded-lg text-sm font-semibold shadow-sm bg-white text-emerald-700 transition-all flex justify-center items-center gap-2";
        btnStudents.className = "flex-1 py-2 rounded-lg text-sm font-semibold text-slate-500 hover:text-slate-700 transition-all flex justify-center items-center gap-2";
    }
}

const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('csvFile');
const feedback = document.getElementById('uploadFeedback');

// open file picker on click
uploadZone.addEventListener('click', () => {
    fileInput.click();
});

// handle file selection
fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('csv_file', file);

    feedback.innerText = "Uploading...";
    feedback.classList.remove('text-rose-500', 'text-emerald-500');

    try {
        const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        const data = await res.json();

        if (!res.ok) {
            feedback.innerText = data.message || "Upload failed";
            feedback.classList.add('text-rose-500');
        } else {
            loadStudents();
            feedback.innerText = data.message;
            feedback.classList.add('text-emerald-500');
            fileInput.value = ""; // reset input
        }
    } catch (err) {
        console.error(err);
        feedback.innerText = "Network error";
        feedback.classList.add('text-rose-500');
    }
});

async function loadStudents() {
    total = document.getElementById('total')

    fetch('/api/get-dm')
        .then(res => {
            if (!res.ok) showAlert('error', res.status);
            return res.json();
        })
        .then(data => {
            const list = document.getElementById('studentList');
            list.innerHTML = "";

            students = data.students;
            total = data.total;

            document.getElementById('total').innerText = `${total} Total`

            students.forEach(s => {
                list.innerHTML += `
                    <li class="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="h-9 w-9 min-h-[36px] min-w-[36px] max-h-[36px] max-w-[36px] bg-slate-100 rounded-full flex items-center justify-center
                            text-slate-500 font-bold text-xs">${s.full_name[0]}</div>
                            <div>
                                <p class="font-bold text-slate-700 text-sm">${s.full_name}</p>
                                <p class="text-xs text-slate-400">${s.student_id} • ${s.course} ${s.year}</p>
                            </div>
                        </div>
                        <button hidden class="text-slate-300"><span class="material-icons-round text-lg">more_vert</span></button>
                    </li>
                `
            })
        })
}

const searchBox = document.getElementById('searchBox');
const studentList = document.getElementById('studentList');

searchBox.addEventListener('input', () => {
    const query = searchBox.value.toLowerCase().trim();
    
    const items = studentList.querySelectorAll('li');

    items.forEach(li => {
        const text = li.innerText.toLowerCase();
        li.style.display = text.includes(query) ? 'flex' : 'none';
    });
});

async function loadEvents() {
    const list = document.getElementById('event-list');
    list.innerHTML = ""

    try {
        const response = await fetch('/api/event-completed');
        const data = await response.json();

        if (data) {
            data.forEach(d => {
                list.innerHTML += `
                        <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
                            <div class="flex justify-between items-start mb-2">
                                <div>
                                    <h4 class="font-bold text-slate-700">${d.name}</h4>
                                    <p class="text-xs text-slate-400">${d.date}</p>
                                </div>
                                <span class="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full">COMPLETED</span>
                            </div>
                            <div class="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                                <div class="text-xs font-semibold text-slate-500">
                                    <span class="text-slate-800 font-bold">${d.present}</span> Present
                                </div>
                                <button onclick="downloadCSV(${d.event_id}, '${d.name}', '${d.date_simplified}')" class="flex items-center gap-1 bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-lg active:scale-95 transition-transform">
                                    <span class="material-icons-round text-sm">download</span> Export
                                </button>
                            </div>
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
    await loadStudents();
    await loadEvents();

    const app = document.getElementById("app");
    app.classList.remove("opacity-0");
    app.classList.add("opacity-100");
});