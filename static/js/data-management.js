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
                            <div class="h-9 w-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-xs">${s.full_name[0]}</div>
                            <div>
                                <p class="font-bold text-slate-700 text-sm">${s.full_name}</p>
                                <p class="text-xs text-slate-400">${s.student_id} • ${s.course} ${s.year}</p>
                            </div>
                        </div>
                        <button class="text-slate-300"><span class="material-icons-round text-lg">more_vert</span></button>
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

document.addEventListener('DOMContentLoaded', loadStudents());
