// ============================================================
        // 1. CONFIGURAÇÃO DAS FONTES DE NOTÍCIAS (RSS → JSON via rss2json)
        // ============================================================
        const NEWS_SOURCES = {
            br: [
                {
                    name: 'G1',
                    url: 'https://g1.globo.com/rss/g1/'
                },
                {
                    name: 'UOL',
                    url: 'https://rss.uol.com.br/feed/noticias.xml'
                }
                // Você pode adicionar mais: Folha, Estadão, etc.
            ],
            international: [
                {
                    name: 'BBC',
                    url: 'http://feeds.bbci.co.uk/news/world/rss.xml'
                },
                {
                    name: 'CNN',
                    url: 'http://rss.cnn.com/rss/cnn_topstories.rss'
                }
                // Adicione NYT, Reuters, etc.
            ]
        };

        // ============================================================
        // 2. FUNÇÃO PRINCIPAL DE NOTÍCIAS (com cache e random)
        // ============================================================
        const fetchNews = async () => {
            const container = document.getElementById('news-feed-container');
            const CACHE_KEY = 'cachedNews_v5'; // versão nova
            const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

            // Helper: randomizar e pegar N itens
            const getRandomItems = (arr, count = 2) => {
                if (!arr || !arr.length) return [];
                const shuffled = [...arr].sort(() => 0.5 - Math.random());
                return shuffled.slice(0, count);
            };

            // Renderiza os artigos no container
            const render = (articles) => {
                container.innerHTML = '';
                if (!articles.length) {
                    container.innerHTML = '<p class="empty-msg">Nenhuma notícia encontrada no momento.</p>';
                    return;
                }
                container.innerHTML = articles.map(article => `
                    <a href="${article.link}" class="news-card" target="_blank" rel="noopener">
                        <h3 class="news-card__title">${article.title}</h3>
                        <p class="news-card__summary">${article.description ? article.description.replace(/<[^>]+>/g, '').substring(0, 120) + '...' : ''}</p>
                        <span class="news-card__source">${article.source || 'Fonte'}</span>
                    </a>
                `).join('');
            };

            // --- Verifica cache ---
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const data = JSON.parse(cached);
                if (Date.now() - data.timestamp < CACHE_DURATION) {
                    const combined = [
                        ...getRandomItems(data.brItems, 2),
                        ...getRandomItems(data.wItems, 2)
                    ];
                    return render(combined);
                }
            }

            // --- Busca novas notícias ---
            try {
                // Constrói as URLs para rss2json
                const buildRssUrl = (rssUrl) =>
                    `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

                // Busca todas as fontes em paralelo
                const allSources = [
                    ...NEWS_SOURCES.br.map(s => ({ ...s, type: 'br' })),
                    ...NEWS_SOURCES.international.map(s => ({ ...s, type: 'int' }))
                ];

                const fetchPromises = allSources.map(async (source) => {
                    try {
                        const res = await fetch(buildRssUrl(source.url));
                        if (!res.ok) return null;
                        const data = await res.json();
                        if (data && data.items && data.items.length) {
                            // Adiciona o nome da fonte em cada item
                            return data.items.map(item => ({
                                ...item,
                                source: source.name
                            }));
                        }
                        return null;
                    } catch (e) {
                        console.warn(`Erro ao buscar ${source.name}:`, e);
                        return null;
                    }
                });

                const results = await Promise.all(fetchPromises);

                // Junta todos os itens válidos
                let allBrItems = [];
                let allIntItems = [];

                results.forEach((items, index) => {
                    if (!items) return;
                    const source = allSources[index];
                    if (source.type === 'br') {
                        allBrItems = allBrItems.concat(items);
                    } else {
                        allIntItems = allIntItems.concat(items);
                    }
                });

                // Se não veio nada, usa fallback (G1 e BBC)
                if (!allBrItems.length || !allIntItems.length) {
                    // Fallback simples: tenta buscar apenas G1 e BBC
                    const fallback = await fetchFallbackNews();
                    allBrItems = fallback.brItems;
                    allIntItems = fallback.intItems;
                }

                // Salva no cache
                localStorage.setItem(CACHE_KEY, JSON.stringify({
                    brItems: allBrItems,
                    wItems: allIntItems,
                    timestamp: Date.now()
                }));

                // Seleciona aleatoriamente 2 de cada grupo e renderiza
                const combined = [
                    ...getRandomItems(allBrItems, 2),
                    ...getRandomItems(allIntItems, 2)
                ];
                render(combined);

            } catch (error) {
                console.error('Erro geral em fetchNews:', error);
                container.innerHTML = '<p class="empty-msg">Erro ao carregar notícias. Tente novamente mais tarde.</p>';
            }
        };

        // --- Fallback caso as novas fontes falhem ---
        const fetchFallbackNews = async () => {
            try {
                const [g1, bbc] = await Promise.all([
                    fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent('https://g1.globo.com/rss/g1/')}`),
                    fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent('http://feeds.bbci.co.uk/news/world/rss.xml')}`)
                ]);
                const g1Data = g1.ok ? await g1.json() : null;
                const bbcData = bbc.ok ? await bbc.json() : null;
                return {
                    brItems: g1Data?.items?.map(i => ({ ...i, source: 'G1' })) || [],
                    intItems: bbcData?.items?.map(i => ({ ...i, source: 'BBC' })) || []
                };
            } catch {
                return { brItems: [], intItems: [] };
            }
        };

        // ============================================================
        // 3. FUNÇÕES DE CLIMA (sem alterações, mas mantidas)
        // ============================================================
        const getSavedCities = () => JSON.parse(localStorage.getItem('myWeatherCities')) || [
            { id: 1, name: 'Lavras', lat: -21.2466, lon: -45.0022 }
        ];

        const renderWeather = async () => {
            const container = document.getElementById('weather-cards-wrapper');
            const cities = getSavedCities();
            container.innerHTML = '';

            if (!cities.length) {
                return container.innerHTML = '<p class="empty-msg">Nenhuma cidade adicionada.</p>';
            }

            for (const city of cities) {
                try {
                    const res = await fetch(
                        `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`
                    );
                    const data = await res.json();

                    const curr = Math.round(data.current_weather.temperature);
                    const getDayName = (offset) =>
                        new Date(data.daily.time[offset] + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short' });

                    container.innerHTML += `
                        <article class="weather-card">
                            <header class="weather-card__header">
                                <h3 class="weather-card__title">${city.name}</h3>
                                <button class="btn--danger-mini" onclick="removeCity(${city.id})">✕</button>
                            </header>
                            <p class="weather-card__current">${curr}°C - Agora</p>
                            <div class="weather-forecast-list">
                                <div class="weather-forecast-day"><strong>${getDayName(1)}</strong> ${Math.round(data.daily.temperature_2m_min[1])}~${Math.round(data.daily.temperature_2m_max[1])}°C</div>
                                <div class="weather-forecast-day"><strong>${getDayName(2)}</strong> ${Math.round(data.daily.temperature_2m_min[2])}~${Math.round(data.daily.temperature_2m_max[2])}°C</div>
                            </div>
                        </article>`;
                } catch (e) {
                    console.error(e);
                }
            }
        };

        window.addNewCity = async () => {
            const input = document.getElementById('weather-city-input');
            const errorMsg = document.getElementById('weather-city-error');
            const name = input.value.trim();
            if (!name) return;

            try {
                const res = await fetch(
                    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=pt&format=json`
                );
                const data = await res.json();

                if (data.results?.length) {
                    const loc = data.results[0];
                    const cities = getSavedCities();
                    cities.push({ id: Date.now(), name: loc.name, lat: loc.latitude, lon: loc.longitude });
                    localStorage.setItem('myWeatherCities', JSON.stringify(cities));
                    input.value = '';
                    errorMsg.style.display = 'none';
                    renderWeather();
                } else {
                    errorMsg.style.display = 'block';
                }
            } catch (e) {
                console.error(e);
            }
        };

        window.removeCity = (id) => {
            const cities = getSavedCities().filter(c => c.id !== id);
            localStorage.setItem('myWeatherCities', JSON.stringify(cities));
            renderWeather();
        };

        // ============================================================
        // 4. INICIALIZAÇÃO
        // ============================================================
        document.addEventListener('DOMContentLoaded', () => {
            fetchNews();
            renderWeather();

            // Eventos do botão de adicionar cidade
            document.getElementById('btn-add-city')?.addEventListener('click', addNewCity);
            document.getElementById('weather-city-input')?.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') addNewCity();
            });
        });