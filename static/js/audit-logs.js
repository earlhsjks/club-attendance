document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const logsContainer = document.getElementById('logsContainer');
    const logItems = document.querySelectorAll('.log-item');
    const noResults = document.getElementById('noResults');

    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        let visibleCount = 0;

        logItems.forEach(item => {
            // Get all text content inside the card (User, Action, IP, Time)
            const textContent = item.textContent.toLowerCase();

            // Check if the search term exists in the text
            if (textContent.includes(searchTerm)) {
                item.style.display = ''; // Show
                visibleCount++;
            } else {
                item.style.display = 'none'; // Hide
            }
        });

        // Toggle "No Results" message
        if (visibleCount === 0) {
            noResults.classList.remove('hidden');
            // Optional: Hide the container padding/margin if empty to clean up layout
            logsContainer.classList.add('hidden'); 
        } else {
            noResults.classList.add('hidden');
            logsContainer.classList.remove('hidden');
        }
    });
});

function loadLogs() {
    const container = document.querySelector('.space-y-3');

    fetch('/api/logs')
        .then(res => res.json())
        .then(data => {
            container.innerHTML = ''; // Clear any placeholder content

            data.forEach(log => {
                const card = document.createElement('div');
                card.className = `bg-white p-4 rounded-xl shadow-sm border-l-4 border-${log.color}-500 flex flex-col gap-2`;

                card.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div class="flex items-center gap-2">
                            <span class="bg-${log.color}-100 text-${log.color}-600 p-1 rounded text-xs font-bold uppercase tracking-wider">${log.type}</span>
                            <span class="font-bold text-slate-700 text-sm">${log.user}</span>
                        </div>
                        <span class="text-[10px] font-bold text-slate-400">${log.time}</span>
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
        })
        .catch(err => console.error('Error fetching logs:', err));
}

window.addEventListener('DOMContentLoaded', () => {loadLogs()})