// ============================================================
// MAIN DASHBOARD (SYS.HUD CORE) - FIREBASE CONNECTED
// ============================================================
import { db, collection, doc, updateDoc, onSnapshot } from '../core/firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    initProtocol();
    initOperations();
    initEntertainment();
    initSupplies();
    initIntelFeed();
    initRadar();
});

// --- 1. PROTOCOL DIRECTIVE (100% FIREBASE) ---
const initProtocol = () => {
    const container = document.getElementById('nexts-protocol');
    if (!container) return;

    onSnapshot(collection(db, "protocol_tasks"), (snapshot) => {
        const allTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Descobre o dia da semana atual (em inglês, minúsculo)
        const todayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];
        // Pega a data de hoje no formato YYYY-MM-DD
        const todayStr = new Date().toISOString().split('T')[0];

        const todayTasks = allTasks
            .filter(t => t.day === todayName)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

        if (!todayTasks.length) {
            container.innerHTML = '<p class="sys-msg">No tasks scheduled for today.</p>';
            return;
        }

        container.innerHTML = '';
        
        todayTasks.forEach(task => {
            // Verifica no banco de dados se a tarefa já foi concluída HOJE
            const isDone = task.lastCompletedDate === todayStr;
            
            const node = document.createElement('article');
            node.className = `task-node ${isDone ? 'is-completed' : ''}`;
            node.innerHTML = `
                <span class="txt-micro" style="color: var(--text-muted)">[${task.tag}]</span>
                <h4 class="txt-heading-md">${task.task}</h4>
                <span class="txt-micro">${task.startTime}${task.endTime ? ' ~ ' + task.endTime : ''}</span>
            `;

            // Quando clicar, atualiza o status DIRETAMENTE NO FIREBASE
            node.addEventListener('click', async () => {
                const newDate = isDone ? null : todayStr;
                try {
                    await updateDoc(doc(db, "protocol_tasks", task.id), { 
                        lastCompletedDate: newDate 
                    });
                } catch (error) {
                    console.error("SYS.ERR: Failed to sync protocol status.", error);
                }
            });

            container.appendChild(node);
        });
    });
};

// --- 2. ACTIVE OPERATIONS ---
const initOperations = () => {
    const container = document.getElementById('objectviesHome');
    if (!container) return;

    onSnapshot(collection(db, "operations_tasks"), (snapshot) => {
        const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    });
};

// --- 3. MEDIA EXECUTION ---
const initEntertainment = () => {
    const container = document.getElementById('entertainmentHome');
    if (!container) return;

    onSnapshot(collection(db, "entertainment_items"), (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    });
};
// --- 4. LOGISTICS & SUPPLIES (100% FIREBASE) ---
const initSupplies = () => {
    const container = document.getElementById('supplies-home');
    if (!container) return;

    // Fica escutando a coleção na nuvem em tempo real
    onSnapshot(collection(db, "hub_inventory"), (snapshot) => {
        const inventory = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const activeItems = inventory.filter(i => i.status === 'in-stock' || i.status === 'opened');

        if (!activeItems.length) {
            container.innerHTML = '<p class="sys-msg">Inventory clear.</p>';
            return;
        }

        // Desenha os itens
        container.innerHTML = activeItems.map(item => {
            const isOpened = item.status === 'opened';
            return `
                <div class="data-row jc-spacebetween" style="margin-bottom: var(--sp-2); ${isOpened ? 'border-left-color: var(--accent-alert);' : 'border-left-color: var(--border-light);'} border-left-width: 3px; justify-content: space-between;">
                    <div class="data-row__main">
                        <span class="data-row__title" title="${item.name}">${item.name}</span>
                        <span class="txt-micro">${isOpened ? 'DEPLETING' : 'STOCKED'}</span>
                    </div>
                    <button class="btn ${isOpened ? 'btn--danger' : 'btn--ghost'}" id="btn-supply-${item.id}">
                        ${isOpened ? 'TERM' : 'EXEC'}
                    </button>
                </div>
            `;
        }).join('');

        // Adiciona a lógica de clique para atualizar direto no Firebase
        activeItems.forEach(item => {
            const btn = document.getElementById(`btn-supply-${item.id}`);
            if (btn) {
                btn.addEventListener('click', async () => {
                    const newStatus = item.status === 'opened' ? 'ended' : 'opened';
                    const dateField = item.status === 'opened' ? 'dateEnded' : 'dateOpened';
                    try {
                        await updateDoc(doc(db, "hub_inventory", item.id), {
                            status: newStatus,
                            [dateField]: new Date().toISOString().split('T')[0]
                        });
                    } catch(err) { 
                        console.error("SYS.ERR: Update failed.", err); 
                    }
                });
            }
        });
    });
};

// --- 5. GLOBAL INTEL FEED (NEWS) ---
const initIntelFeed = async () => {
    const container = document.getElementById('news-feed-container');
    if (!container) return;

    // Mensagem de carregamento enquanto busca os 6 sinais
    container.innerHTML = '<p class="sys-msg" style="grid-column: 1 / -1;">Intercepting global signals...</p>';

    // Lista dos 3 maiores do Brasil e 3 do Mundo
    const RSS_SOURCES = [
        { name: 'G1', url: 'https://g1.globo.com/rss/g1/' },
        { name: 'UOL', url: 'http://rss.uol.com.br/feed/noticias.xml' },
        { name: 'Folha de S.Paulo', url: 'https://feeds.folha.uol.com.br/emcimadahora/rss091.xml' },
        { name: 'BBC News (World)', url: 'http://feeds.bbci.co.uk/news/world/rss.xml' },
        { name: 'New York Times', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml' },
        { name: 'The Guardian', url: 'https://www.theguardian.com/world/rss' }
    ];
    
    try {
        // Dispara as 6 requisições simultaneamente para não demorar
        const fetchPromises = RSS_SOURCES.map(site => 
            fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(site.url)}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                // Pega APENAS a primeira notícia (índice 0) de cada site
                if (data && data.items && data.items.length > 0) {
                    return {
                        title: data.items[0].title,
                        link: data.items[0].link,
                        source: site.name
                    };
                }
                return null; // Caso o site não responda
            })
            .catch(() => null)
        );
        
        // Aguarda todos os sites responderem
        const results = await Promise.all(fetchPromises);
        
        // Remove da lista os sites que por acaso deram erro no momento
        const validItems = results.filter(item => item !== null);

        if (!validItems.length) throw new Error("No intel gathered");

        // Desenha os 6 cards na tela
        container.innerHTML = validItems.map(article => `
            <a href="${article.link}" class="data-row data-row-news" target="_blank" rel="noopener" style="display: flex; flex-direction: column; align-items: flex-start; height: 100%;">
                <h4 class="data-row__title" style="white-space: normal; margin-bottom: 4px;">${article.title}</h4>
                <span class="txt-micro" style="color: var(--accent-primary); font-weight: bold;">[${article.source}]</span>
            </a>
        `).join('');

    } catch (e) {
        console.error(e);
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

    // Converte o código WMO da API para ícones SVG monocromáticos limpos
    const getWeatherIcon = (wmoCode) => {
        const svgStyle = 'width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
        const icons = {
            sun: `<svg ${svgStyle}><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
            cloud: `<svg ${svgStyle}><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>`,
            rain: `<svg ${svgStyle}><line x1="16" y1="13" x2="16" y2="21"></line><line x1="8" y1="13" x2="8" y2="21"></line><line x1="12" y1="15" x2="12" y2="23"></line><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path></svg>`,
            storm: `<svg ${svgStyle}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
            snow: `<svg ${svgStyle}><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line><path d="m20 16-4-4 4-4"></path><path d="m4 8 4 4-4 4"></path><path d="m16 4-4 4-4-4"></path><path d="m8 20 4-4 4 4"></path></svg>`
        };

        if (wmoCode === 0) return icons.sun;
        if (wmoCode > 0 && wmoCode <= 48) return icons.cloud; // Nublado ou neblina
        if ((wmoCode >= 51 && wmoCode <= 67) || (wmoCode >= 80 && wmoCode <= 82)) return icons.rain;
        if (wmoCode >= 71 && wmoCode <= 77 || wmoCode === 85 || wmoCode === 86) return icons.snow;
        if (wmoCode >= 95) return icons.storm;
        return icons.cloud; // fallback
    };

    // Converte a data (YYYY-MM-DD) para "TOMORROW" ou o dia da semana em inglês (ex: "SUNDAY")
    const getDayName = (dateStr, isTomorrow) => {
        if (isTomorrow) return 'TOMORROW';
        const [year, month, day] = dateStr.split('-');
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    };

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
                const iconSvg = getWeatherIcon(data.current_weather.weathercode);
                
                const day1 = getDayName(data.daily.time[1], false);
                const day2 = getDayName(data.daily.time[2], false);

                container.innerHTML += `
                    <div class="data-row" style="flex-direction: column; align-items: flex-start; position: relative;">
                        <button class="btn--danger" style="position: absolute; top: var(--sp-2); right: var(--sp-2); padding: 2px 6px; font-size: 0.6rem; border: none;" onclick="window.removeCity(${city.id})">X</button>
                        <h4 class="txt-heading-md" style="display: flex;align-items: center; gap: 8px">
                            <div style=" color: var(--accent-success); margin-top:4px">
                                ${iconSvg}
                            </div>
                            ${city.name}
                            <div class="txt-micro" style="color: var(--accent-success)">
                                ${curr}°C
                            </div>

                        </h4>
                        
                        <div style="display: row; flex-direction: column; gap: var(--sp-2); margin-top: -10px; border-top: 1px dashed var(--border-light); padding-top: var(--sp-1); width: 100%;">
                            <span class="txt-micro">${day1[0] + day1[1] + day1[2]}: ${Math.round(data.daily.temperature_2m_min[1])}/${Math.round(data.daily.temperature_2m_max[1])}°C</span>
                            <span class="txt-micro">|</span>
                            <span class="txt-micro">${day2[0] + day2[1] + day2[2]}: ${Math.round(data.daily.temperature_2m_min[2])}/${Math.round(data.daily.temperature_2m_max[2])}°C</span>
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