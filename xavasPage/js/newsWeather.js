const fetchNews = async () => {
    const container = document.getElementById("news-feed-container");
    const CACHE_KEY = 'cachedNews_v3';
    const CACHE_DURATION = 5 * 60 * 1000;

    // Retorna até N itens aleatórios
    const getRandomItems = (arr, count = 2) => {
        if (!arr || !arr.length) return [];
        const shuffled = [...arr].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    };

    const render = (articles) => {
        container.innerHTML = "";
        if (!articles.length) {
            container.innerHTML = "<p class='empty-msg'>No news found.</p>";
            return;
        }
        container.innerHTML = articles.map(article => `
            <a href="${article.link}" class="news-card" target="_blank">
                <h3 class="news-card__title">${article.title}</h3>
                <p class="news-card__summary">${article.description ? article.description.replace(/<[^>]+>/g, '').substring(0, 120) + '...' : ''}</p>
            </a>
        `).join('');
    };

    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
        const data = JSON.parse(cached);
        if (Date.now() - data.timestamp < CACHE_DURATION) {
            const combined = [...getRandomItems(data.brItems, 3), ...getRandomItems(data.wItems, 3)];
            return render(combined);
        }
    }

    try {
        const [brRes, wRes] = await Promise.all([
            fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent("https://g1.globo.com/rss/g1/")}`),
            fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent("http://feeds.bbci.co.uk/news/world/rss.xml")}`)
        ]);
        const brData = brRes.ok ? await brRes.json() : null;
        const wData = wRes.ok ? await wRes.json() : null;

        const brItems = brData?.items || [];
        const wItems = wData?.items || [];

        localStorage.setItem(CACHE_KEY, JSON.stringify({ brItems, wItems, timestamp: Date.now() }));
        
        const combined = [...getRandomItems(brItems, 2), ...getRandomItems(wItems, 2)];
        render(combined);
    } catch (e) {
        container.innerHTML = "<p class='empty-msg'>Error loading news.</p>";
    }
};

const getSavedCities = () => JSON.parse(localStorage.getItem('myWeatherCities')) || [{ id: 1, name: "Lavras", lat: -21.2466, lon: -45.0022 }];

const renderWeather = async () => {
    const container = document.getElementById('weather-cards-wrapper');
    const cities = getSavedCities();
    container.innerHTML = '';

    if (!cities.length) return container.innerHTML = '<p class="empty-msg">No cities added.</p>';

    for (const city of cities) {
        try {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`);
            const data = await res.json();
            
            const curr = Math.round(data.current_weather.temperature);
            const getDayName = (offset) => new Date(data.daily.time[offset] + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });

            container.innerHTML += `
                <article class="weather-card">
                    <header class="weather-card__header">
                        <h3 class="weather-card__title">${city.name}</h3>
                        <button class="btn btn--danger-mini" onclick="removeCity(${city.id})">X</button>
                    </header>
                    <p class="weather-card__current">${curr}°C - Current</p>
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
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`);
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

document.getElementById('btn-add-city')?.addEventListener('click', addNewCity);
document.getElementById('weather-city-input')?.addEventListener('keypress', (e) => { if (e.key === 'Enter') addNewCity(); });

document.addEventListener('DOMContentLoaded', () => { fetchNews(); renderWeather(); });