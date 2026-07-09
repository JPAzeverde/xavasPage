// ============================================================
// MAIN DASHBOARD (SYS.HUD CORE)
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    initProtocol();
    initOperations();
    initEntertainment();
    initSupplies();
    initIntelFeed();
    initRadar();
});

// --- 1. PROTOCOL DIRECTIVE ---
const initProtocol = () => {
    const container = document.getElementById('nexts-protocol');
    if (!container) return;

    const allTasks = JSON.parse(localStorage.getItem('protocol_tasks')) || [];
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];

    const todayTasks = allTasks.filter(t => t.day === today).sort((a, b) => a.startTime.localeCompare(b.startTime));

    if (!todayTasks.length) {
        container.innerHTML = '<p class="sys-msg">No tasks scheduled for today.</p>';
        return;
    }

    const todayStr = new Date().toDateString();
    let markedData = JSON.parse(localStorage.getItem('protocol_marked_tasks')) || { date: todayStr, taskIds: [] };
    if (markedData.date !== todayStr) markedData = { date: todayStr, taskIds: [] };

    container.innerHTML = '';

    todayTasks.forEach(task => {
        const isDone = markedData.taskIds.includes(task.id);
        const node = document.createElement('article');
        node.className = `task-node ${isDone ? 'is-completed' : ''}`;
        node.innerHTML = `
            <span class="txt-micro" style="color: var(--text-muted)">[${task.tag}]</span>
            <h4 class="txt-heading-md">${task.task}</h4>
            <span class="txt-micro">${task.startTime}${task.endTime ? ' ~ ' + task.endTime : ''}</span>
        `;

        node.addEventListener('click', () => {
            node.classList.toggle('is-completed');
            if (node.classList.contains('is-completed')) {
                markedData.taskIds.push(task.id);
            } else {
                markedData.taskIds = markedData.taskIds.filter(id => id !== task.id);
            }
            localStorage.setItem('protocol_marked_tasks', JSON.stringify(markedData));
        });

        container.appendChild(node);
    });
};

// --- 2. ACTIVE OPERATIONS ---
const initOperations = () => {
    const container = document.getElementById('objectviesHome');
    if (!container) return;

    const tasks = JSON.parse(localStorage.getItem('operations_tasks')) || [];
    const inProgress = tasks
        .filter(t => t.status === 'in-progress')
        .sort((a, b) => (!a.deadline ? 1 : !b.deadline ? -1 : new Date(a.deadline) - new Date(b.deadline)))
        .slice(0, 4);

    if (!inProgress.length) {
        container.innerHTML = '<p class="sys-msg">No active ops detected.</p>';
        return;
    }

    container.innerHTML = inProgress.map(task => {
        const dateStr = task.deadline ? `T-0: ${task.deadline.split('-').reverse().join('/')}` : 'UNSCHEDULED';
        return `
            <div class="data-row" style="margin-bottom: var(--sp-2)">
                <div class="data-row__main">
                    <h4 class="data-row__title">${task.title}</h4>
                    <span class="txt-micro">${task.tag ? `[${task.tag}] ` : ''}${dateStr}</span>
                </div>
            </div>`;
    }).join('');
};

// --- 3. MEDIA EXECUTION (ENTERTAINMENT) ---
const initEntertainment = () => {
    const container = document.getElementById('entertainmentHome');
    if (!container) return;

    const items = JSON.parse(localStorage.getItem('entertainment_items')) || [];
    const inProgress = items.filter(t => t.status === 'in-progress');

    if (!inProgress.length) {
        container.innerHTML = '<p class="sys-msg">Media array offline.</p>';
        return;
    }

    container.innerHTML = inProgress.map(item => `
        <div class="data-row " style="gap: var(--sp-3); margin-bottom: var(--sp-2);">
            <img src="${item.cover}" alt="Cover" style="width: 32px; height: 48px; object-fit: cover; border-radius: 2px;">
            <div class="data-row__main">
                <h4 class="data-row__title">${item.title}</h4>
                <span class="txt-micro" style="color: var(--accent-success)">EXECUTING</span>
            </div>
        </div>
    `).join('');
};

// --- 4. LOGISTICS & SUPPLIES ---
const initSupplies = () => {
    const container = document.getElementById('supplies-home');
    if (!container) return;

    const render = () => {
        const inventory = JSON.parse(localStorage.getItem('hub_inventory')) || [];
        const activeItems = inventory.filter(i => i.status === 'in-stock' || i.status === 'opened');

        if (!activeItems.length) {
            container.innerHTML = '<p class="sys-msg">Inventory clear.</p>';
            return;
        }

        container.innerHTML = activeItems.map(item => {
            const isOpened = item.status === 'opened';
            return `
                <div class="data-row jc-spacebetween" style="margin-bottom: var(--sp-2); ${isOpened ? 'border-left-color: var(--accent-alert);' : 'border-left-color: var(--border-light);'} border-left-width: 3px; justify-content: space-between;">
                    <div class="data-row__main">
                        <span class="data-row__title" title="${item.name}">${item.name}</span>
                        <span class="txt-micro">${isOpened ? 'DEPLETING' : 'STOCKED'}</span>
                    </div>
                    <button class="btn ${isOpened ? 'btn--danger' : 'btn--ghost'}" 
                            onclick="window.${isOpened ? 'finishSupply' : 'openSupply'}('${item.id}')">
                        ${isOpened ? 'TERM' : 'EXEC'}
                    </button>
                </div>
            `;
        }).join('');
    };

    window.openSupply = (id) => updateSupplyStatus(id, 'opened', 'dateOpened', render);
    window.finishSupply = (id) => updateSupplyStatus(id, 'ended', 'dateEnded', render);

    render();
};

const updateSupplyStatus = (id, status, dateField, reRenderCb) => {
    let inventory = JSON.parse(localStorage.getItem('hub_inventory')) || [];
    const idx = inventory.findIndex(i => i.id === id);
    if (idx > -1) {
        inventory[idx].status = status;
        inventory[idx][dateField] = new Date().toISOString().split('T')[0];
        localStorage.setItem('hub_inventory', JSON.stringify(inventory));
        reRenderCb();
    }
};

// --- 5. GLOBAL INTEL FEED (NEWS) ---
const initIntelFeed = async () => {
    const container = document.getElementById('news-feed-container');
    if (!container) return;

    const RSS_URLS = ['https://g1.globo.com/rss/g1/', 'http://feeds.bbci.co.uk/news/world/rss.xml'];
    
    try {
        const fetchPromises = RSS_URLS.map(url => 
            fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`)
            .then(res => res.ok ? res.json() : null)
        );
        
        const results = await Promise.all(fetchPromises);
        let items = [];
        
        results.forEach(data => {
            if (data && data.items) items = items.concat(data.items.slice(0, 2));
        });

        if (!items.length) throw new Error("No intel gathered");

        container.innerHTML = items.map(article => `
            <a href="${article.link}" class="data-row data-row-news" target="_blank" rel="noopener" style="display: flex; flex-direction: column; align-items: flex-start; height: 100%;">
                <h4 class="data-row__title" style="white-space: normal; margin-bottom: 4px;">${article.title}</h4>
                <span class="txt-micro">${article.source || 'INTEL'}</span>
            </a>
        `).join('');

    } catch (e) {
        container.innerHTML = '<p class="sys-msg" style="grid-column: 1 / -1;">Signal lost. Unable to fetch intel.</p>';
    }
};

// --- 6. METEOROLOGICAL RADAR (WEATHER) ---
const initRadar = () => {
    const container = document.getElementById('weather-cards-wrapper');
    const input = document.getElementById('weather-city-input');
    const btn = document.getElementById('btn-add-city');
    const errorMsg = document.getElementById('weather-city-error');

    if (!container) return;

    const getSavedCities = () => JSON.parse(localStorage.getItem('myWeatherCities')) || [{ id: 1, name: 'Lavras', lat: -21.2466, lon: -45.0022 }];

    const render = async () => {
        const cities = getSavedCities();
        container.innerHTML = '';

        if (!cities.length) {
            container.innerHTML = '<p class="sys-msg">No targets acquired.</p>';
            return;
        }

        for (const city of cities) {
            try {
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto`);
                const data = await res.json();

                const curr = Math.round(data.current_weather.temperature);
                
                container.innerHTML += `
                    <div class="data-row" style="flex-direction: column; align-items: flex-start; position: relative;">
                        <button class="btn--danger" style="position: absolute; top: var(--sp-2); right: var(--sp-2); padding: 2px 6px; font-size: 0.6rem; border: none;" onclick="window.removeCity(${city.id})">X</button>
                        <h4 class="txt-heading-md">${city.name}</h4>
                        <span class="txt-micro" style="color: var(--accent-success)">CURRENT: ${curr}°C</span>
                        <div style="display: flex; gap: var(--sp-3); margin-top: var(--sp-2); border-top: 1px dashed var(--border-dark); padding-top: var(--sp-1); width: 100%;">
                            <span class="txt-micro">T+1: ${Math.round(data.daily.temperature_2m_min[1])}~${Math.round(data.daily.temperature_2m_max[1])}°C</span>
                            <span class="txt-micro">T+2: ${Math.round(data.daily.temperature_2m_min[2])}~${Math.round(data.daily.temperature_2m_max[2])}°C</span>
                        </div>
                    </div>`;
            } catch (e) {
                console.error(e);
            }
        }
    };

    window.removeCity = (id) => {
        const cities = getSavedCities().filter(c => c.id !== id);
        localStorage.setItem('myWeatherCities', JSON.stringify(cities));
        render();
    };

    const addCity = async () => {
        const name = input.value.trim();
        if (!name) return;

        try {
            const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`);
            const data = await res.json();

            if (data.results?.length) {
                const loc = data.results[0];
                const cities = getSavedCities();
                cities.push({ id: Date.now(), name: loc.name, lat: loc.latitude, lon: loc.longitude });
                localStorage.setItem('myWeatherCities', JSON.stringify(cities));
                input.value = '';
                errorMsg.style.display = 'none';
                render();
            } else {
                errorMsg.style.display = 'block';
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (btn) btn.addEventListener('click', addCity);
    if (input) input.addEventListener('keypress', (e) => { if (e.key === 'Enter') addCity(); });

    render();
};