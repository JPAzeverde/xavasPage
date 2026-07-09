async function fetchNews() {
    const newsContainer = document.getElementById("news-feed-container");
    const CACHE_KEY = 'cachedNews_v2';
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

    // Função auxiliar para selecionar um artigo aleatório do array
    const getRandomArticle = (items) => {
        if (!items || items.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * items.length);
        return items[randomIndex];
    };

    // Verifica se há cache válido
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
        const { brazilItems, worldItems, timestamp } = JSON.parse(cached);
        
        if (Date.now() - timestamp < CACHE_DURATION) {
            // Cache é válido: pega uma notícia diferente/aleatória da lista salva
            renderArticles({
                brazilArticle: getRandomArticle(brazilItems),
                worldArticle: getRandomArticle(worldItems)
            });
            return;
        }
    }

    // Se não há cache ou expirou, busca da API
    const brazilRss = "https://g1.globo.com/rss/g1/";
    const worldRss = "http://feeds.bbci.co.uk/news/world/rss.xml";
    const brazilUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(brazilRss)}`;
    const worldUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(worldRss)}`;

    try {
        const [brazilResponse, worldResponse] = await Promise.all([
            fetch(brazilUrl),
            fetch(worldUrl)
        ]);

        const brazilData = brazilResponse.ok ? await brazilResponse.json() : null;
        const worldData = worldResponse.ok ? await worldResponse.json() : null;

        // Pegamos as listas completas (ou um array vazio se der erro)
        const brazilItems = brazilData?.items || [];
        const worldItems = worldData?.items || [];

        // Salva a LISTA COMPLETA no cache, e não apenas um artigo
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            brazilItems,
            worldItems,
            timestamp: Date.now()
        }));

        // Renderiza passando um artigo aleatório das novas listas
        renderArticles({
            brazilArticle: getRandomArticle(brazilItems),
            worldArticle: getRandomArticle(worldItems)
        });

    } catch (error) {
        console.error("Erro ao carregar notícias:", error);
        
        // Tenta usar o cache mesmo que expirado, como fallback
        const oldCache = localStorage.getItem(CACHE_KEY);
        if (oldCache) {
            const { brazilItems, worldItems } = JSON.parse(oldCache);
            renderArticles({
                brazilArticle: getRandomArticle(brazilItems),
                worldArticle: getRandomArticle(worldItems)
            });
        } else {
            newsContainer.innerHTML = "<p>Erro ao carregar as notícias.</p>";
        }
    }
}

function renderArticles({ brazilArticle, worldArticle }) {
    const newsContainer = document.getElementById("news-feed-container");
    newsContainer.innerHTML = "";

    if (!brazilArticle && !worldArticle) {
        newsContainer.innerHTML = "<p>Nenhuma notícia encontrada.</p>";
        return;
    }

    function createCard(article, sourceLabel) {
        if (!article) return "";
        return `
            <a href="${article.link}" class="news-card" target="_blank">
                
                <h2 class="news-card-title">${article.title}</h2>
                <p class="news-card-summary">
                    ${article.description ? article.description.replace(/<[^>]+>/g, '').substring(0, 200) + '...' : ''}
                </p>
            </a>
        `;
    }

    newsContainer.innerHTML += createCard(worldArticle, "Mundo");
    newsContainer.innerHTML += createCard(brazilArticle, "Brasil");
    
}

// --- 2. GERENCIAMENTO DE CIDADES E CLIMA ---
// A cidade padrão agora não tem a sigla do estado
const defaultCity = { id: Date.now(), name: "Lavras", lat: -21.2466, lon: -45.0022 };

function getSavedCities() {
    const saved = localStorage.getItem('myWeatherCities');
    return saved ? JSON.parse(saved) : [defaultCity];
}

function getWeatherCondition(code) {
    if (code <= 3) return "Cloudy";
    if (code > 3 && code < 80) return "Rainy";
    if (code >= 80) return "Stormy"; // ou "Thunderstorm" se preferir
    return "Clear";
}

async function renderWeather() {
    const weatherContainer = document.getElementById('weather-cards-wrapper'); // Atualizado
    const cities = getSavedCities();
    weatherContainer.innerHTML = ''; 

    if (cities.length === 0) {
        weatherContainer.innerHTML = '<p>Nenhuma cidade adicionada.</p>';
        return;
    }

    for (const city of cities) {
        // Adicionado "weathercode" na lista de parâmetros "daily" na URL
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,weathercode&timezone=auto`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            // --- DADOS DE HOJE (Índice 0) ---
            const currentTemp = Math.round(data.current_weather.temperature);
            const minTemp = Math.round(data.daily.temperature_2m_min[0]);
            const maxTemp = Math.round(data.daily.temperature_2m_max[0]);
            const condition = getWeatherCondition(data.current_weather.weathercode);

            const sunrise = data.daily.sunrise[0].split("T")[1];
            const sunset = data.daily.sunset[0].split("T")[1];

            // --- DADOS DE AMANHÃ (Índice 1) ---
            const minTemp1 = Math.round(data.daily.temperature_2m_min[1]);
            const maxTemp1 = Math.round(data.daily.temperature_2m_max[1]);
            const sunrise1 = data.daily.sunrise[1].split("T")[1];
            const sunset1 = data.daily.sunset[1].split("T")[1];
            const condition1 = getWeatherCondition(data.daily.weathercode[1]);
            
            // Formatando o nome do dia para o formato local (ex: "quinta-feira")
            const date1 = new Date(data.daily.time[1] + 'T00:00:00');
            const dayName1 = date1.toLocaleDateString('en-US', { weekday: 'short' });

            // --- DADOS DE DEPOIS DE AMANHÃ (Índice 2) ---
            const minTemp2 = Math.round(data.daily.temperature_2m_min[2]);
            const maxTemp2 = Math.round(data.daily.temperature_2m_max[2]);
            const sunrise2 = data.daily.sunrise[2].split("T")[1];
            const sunset2 = data.daily.sunset[2].split("T")[1];
            const condition2 = getWeatherCondition(data.daily.weathercode[2]);

            const date2 = new Date(data.daily.time[2] + 'T00:00:00');
            const dayName2 = date2.toLocaleDateString('en-US', { weekday: 'short' });

            // Variáveis inseridas no HTML com as NOVAS CLASSES
            weatherContainer.innerHTML += `
                <div class="weather-card">
                    <div class="weather-card-header">
                        <h3 class="weather-city-name">${city.name}</h3>
                        <button class="btn-danger-mini" onclick="removeCity(${city.id})">X</button>
                    </div>
                    <p class="weather-temp-current">${currentTemp}°C - ${condition}</p>
                    <p class="weather-sun-time">${sunrise} | ${sunset}</p>
                    <p class="weather-temp-range">${minTemp}°C | ${maxTemp}°C</p>
                    <div class="weather-forecast-list">
                    
                        <div class="weather-forecast-day">
                            <p class="forecast-day-name">${dayName1.toUpperCase()}</p>
                            <p class="forecast-time">${sunrise1}|${sunset1}</p>
                            <p class="forecast-temp-range">${minTemp1}~${maxTemp1}°C</p>
                            <p class="forecast-condition">${condition1}</p>
                        </div>
                        
                        <div class="weather-forecast-day">
                            <p class="forecast-day-name">${dayName2.toUpperCase()}</p>
                            <p class="forecast-time">${sunrise2}|${sunset2}</p>
                            <p class="forecast-temp-range">${minTemp2}~${maxTemp2}°C</p>
                            <p class="forecast-condition">${condition2}</p>
                        </div>
                        
                    </div>
                </div>
            `;
        } catch (error) {
            console.error(`Erro ao carregar o clima de ${city.name}`, error);
        }
    }
}

// --- 3. ADICIONAR E REMOVER CIDADES ---

async function addNewCity() {
    const input = document.getElementById('weather-city-input'); // Atualizado
    const errorMsg = document.getElementById('weather-city-error'); // Atualizado
    const cityName = input.value.trim();

    if (!cityName) return;

    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=pt&format=json`;
    
    try {
        const response = await fetch(geoUrl);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            const loc = data.results[0];
            
            // Verificação no console
            console.log("Dados brutos vindos da API:", loc);

            // Salva apenas o loc.name (sem estado ou país)
            const newCity = {
                id: Date.now(), 
                name: loc.name, 
                lat: loc.latitude,
                lon: loc.longitude
            };

            console.log("Objeto final salvo:", newCity);

            const cities = getSavedCities();
            cities.push(newCity);
            localStorage.setItem('myWeatherCities', JSON.stringify(cities));

            input.value = '';
            errorMsg.style.display = 'none';
            renderWeather();
        } else {
            errorMsg.style.display = 'block';
        }
    } catch (error) {
        console.error("Erro ao buscar cidade:", error);
    }
}

function removeCity(idToRemove) {
    let cities = getSavedCities();
    cities = cities.filter(city => city.id !== idToRemove);
    localStorage.setItem('myWeatherCities', JSON.stringify(cities));
    renderWeather();
}

// --- 4. INICIALIZAÇÃO ---

if (typeof fetchNews === "function") fetchNews(); 

renderWeather();

// Permite adicionar cidade apertando a tecla "Enter"
document.getElementById('weather-city-input').addEventListener('keypress', function (e) { // Atualizado
    if (e.key === 'Enter') {
        addNewCity();
    }
});