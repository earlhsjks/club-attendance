document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const container = document.querySelector('.space-y-3');
    const noResults = document.getElementById('noResults');

    let logsData = []; // store the fetched logs

    // Function to render logs
    function renderLogs(logs) {
        container.innerHTML = '';

        if (logs.length === 0) {
            noResults.classList.remove('hidden');
            return;
        } else {
            noResults.classList.add('hidden');
        }

        logs.forEach(log => {
            const card = document.createElement('div');
            card.className = `log-item bg-white p-4 rounded-xl shadow-sm border-l-4 border-${log.color}-500 flex flex-col gap-2`;

            card.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex items-center gap-2">
                        <span class="bg-${log.color}-100 text-${log.color}-600 p-1 rounded text-xs font-bold uppercase tracking-wider">${log.type}</span>
                        <span class="font-bold text-slate-700 text-sm">${log.user}</span>
                    </div>
                    <span class="text-[10px] font-bold text-slate-400">${log.date} ${log.time}</span>
                </div>
                <div class="bg-slate-50 p-2 rounded border border-slate-100">
                    <p class="text-xs text-slate-600 mb-1"><span class="font-bold">Action:</span> ${log.action}</p>
                    <p class="text-xs text-slate-600 mb-1">${log.details}</p>
                    <div class="flex items-center gap-1 mt-1 pt-1 border-t border-slate-200/50">
                        <span class="material-icons-round text-[10px] text-slate-400">dns</span>
                        <span class="text-[10px] font-mono text-slate-500">${log.ip}</span>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }

    // Fetch logs from API
    function loadLogs() {
        fetch('/api/logs')
            .then(res => res.json())
            .then(data => {
                logsData = data; // store original logs
                renderLogs(logsData);
            })
            .catch(err => console.error('Error fetching logs:', err));
    }

    // Search filtering
    searchInput.addEventListener('input', e => {
        const term = e.target.value.toLowerCase().trim();

        const filtered = logsData.filter(log => {
            return (
                log.user.toLowerCase().includes(term) ||
                log.type.toLowerCase().includes(term) ||
                log.action.toLowerCase().includes(term) ||
                log.details.toLowerCase().includes(term) ||
                log.ip.toLowerCase().includes(term)
            );
        });

        renderLogs(filtered);
    });

    loadLogs();
});
