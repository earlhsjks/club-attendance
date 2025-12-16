async function performSearch() {
    const input = document.getElementById('search-input');
    const container = document.getElementById('main-container');
    const studentId = input.value.trim();

    if (studentId.length < 4) {
        container.innerHTML = getErrorHTML("Please enter a valid Student ID.");
        triggerAnimations(container);
        return;
    }

    container.innerHTML = `
        <div class="text-center py-10">
            <span class="material-icons-round text-4xl text-emerald-500 animate-spin">refresh</span>
            <p class="text-sm text-slate-400 mt-2">Searching records...</p>
        </div>
    `;

    try {
        const res = await fetch(`/api/public/search?student_id=${studentId}`);
        if (!res.ok) throw new Error();
        const data = await res.json();

        const fullHtml = getStudentHTML(data.student) + getAttendanceListHTML(data.attendance);
        
        container.innerHTML = fullHtml;

        triggerAnimations(container);

    } catch (err) {
        container.innerHTML = getErrorHTML();
        triggerAnimations(container);
    }
}

function triggerAnimations(container) {
    const elements = container.querySelectorAll('.result-item');
    
    requestAnimationFrame(() => {
        elements.forEach((el, index) => {
            setTimeout(() => {
                el.classList.add('show-data');
            }, index * 100);
        });
    });
}

function getStudentHTML(student) {
    return `
        <div class="result-item bg-white p-5 rounded-2xl shadow-sm border-l-4 border-emerald-500 flex items-center gap-4 mb-6">
            <div>
                <h2 class="text-lg font-bold text-slate-800 leading-tight">${student.name}</h2>
                <p class="text-sm text-slate-500 font-mono">ID: ${student.student_id}</p>
                <div class="flex items-center gap-2 mt-1">
                     <span class="inline-block bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        ${student.course} - ${student.year}
                     </span>
                </div>
            </div>
        </div>
        <h3 class="result-item text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 ml-1">Recent Attendance</h3>
    `;
}

function getAttendanceListHTML(attendance) {
    if (!attendance || attendance.length === 0) {
        return `<p class="result-item text-xs text-slate-400 ml-6">No attendance records found.</p>`;
    }

    const listItems = attendance.map(a => {
        const isPresent = a.status === "Present";
        const isUpcoming = a.status === "Upcoming";
        
        return `
        <div class="result-item relative pl-6 ${isPresent ? "" : isUpcoming ? "opacity-80" : "opacity-60"}">
            <div class="absolute -left-[9px] top-4 h-4 w-4 rounded-full 
                ${isPresent ? "bg-emerald-500" : isUpcoming ? "bg-blue-500" : "bg-slate-300"} 
                border-2 border-white shadow-sm z-10">
            </div>

            <div class="${isPresent ? "bg-white" : isUpcoming ? "bg-blue-50" : "bg-slate-50"} p-4 rounded-xl shadow-sm border border-slate-100 ${!isPresent && !isUpcoming ? "border-dashed" : ""}">
                <div class="flex justify-between items-start mb-1">
                    <h4 class="font-bold ${isPresent ? "text-slate-700" : isUpcoming ? "text-blue-700" : "text-slate-500"}">
                        ${a.event}
                    </h4>
                    <span class="${isPresent ? "text-emerald-600 bg-emerald-100" : isUpcoming ? "text-blue-600 bg-blue-100" : "text-slate-400 bg-slate-100"} font-bold text-xs px-2 py-1 rounded-md">
                        ${a.status}
                    </span>
                </div>
                <p class="text-xs text-slate-400 mb-2">${a.date}</p>
                ${a.time ? `<p class="text-[10px] font-mono text-slate-400 bg-slate-50 inline-block px-1.5 py-0.5 rounded">Timestamp: ${a.time}</p>` : ""}
            </div>
        </div>
        `;
    }).join('');

    return `<div class="space-y-4 relative pl-4 border-l-2 border-slate-200 ml-2">${listItems}</div>`;
}

function getErrorHTML(customMessage) {
    return `
        <div class="result-item mt-8 text-center">
            <div class="inline-flex h-16 w-16 bg-red-50 rounded-full items-center justify-center mb-4">
                <span class="material-icons-round text-3xl text-red-400">search_off</span>
            </div>
            <h3 class="text-slate-800 font-bold">No Records Found</h3>
            <p class="text-slate-500 text-sm mt-1 max-w-[200px] mx-auto">
                ${customMessage || "We couldn't find an attendance history for that ID number."}
            </p>
        </div>
    `;
}

document.getElementById('search-input').addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        performSearch();
    }
});
