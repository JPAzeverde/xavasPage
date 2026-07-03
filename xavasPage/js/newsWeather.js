// --- 1. NOTÍCIAS ---
async function fetchNews() {
    const newsContainer = document.getElementById('news-container');
    try {
        const response = await fetch('https://servicodados.ibge.gov.br/api/v3/noticias/?qtd=2');
        const data = await response.json();
        newsContainer.innerHTML = ''; 
        data.items.forEach(news => {
            newsContainer.innerHTML += `
                <div class="news-item">   
                    <a href="${news.link}" target="_blank"><h2>${news.titulo}</h2></a>
                    <a href="${news.link}" target="_blank"><p class="news-summary">${news.introducao}</p></a>
                </div>
            `;
        });
    } catch (error) {
        newsContainer.innerHTML = '<p>Erro ao carregar as notícias.</p>';
    }
}

// --- 2. GERENCIAMENTO DE CIDADES E CLIMA ---
const defaultCity = { id: Date.now(), name: "Lavras, MG", lat: -21.2466, lon: -45.0022 };

function getSavedCities() {
    const saved = localStorage.getItem('myWeatherCities');
    return saved ? JSON.parse(saved) : [defaultCity];
}

function getWeatherCondition(code) {
    if (code <= 3) return "Parcialmente Nublado";
    if (code > 3 && code < 80) return "Chuvoso";
    if (code >= 80) return "Tempestade";
    return "Céu Limpo / Ensolarado";
}

async function renderWeather() {
    const weatherContainer = document.getElementById('weather-container');
    const cities = getSavedCities();
    weatherContainer.innerHTML = ''; 

    if (cities.length === 0) {
        weatherContainer.innerHTML = '<p>Nenhuma cidade adicionada.</p>';
        return;
    }

    for (const city of cities) {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            const currentTemp = Math.round(data.current_weather.temperature);
            const minTemp = Math.round(data.daily.temperature_2m_min[0]);
            const maxTemp = Math.round(data.daily.temperature_2m_max[0]);
            const condition = getWeatherCondition(data.current_weather.weathercode);

            weatherContainer.innerHTML += `
                <div class="weather-item">
                    <div class="weather-item-header">
                        <h3>${city.name}</h3>
                        <button class="btn-danger-mini" onclick="removeCity(${city.id})">X</button>
                        
                    </div>
                    
                    
                    <p><strong>Atual:</strong> ${currentTemp} °C</p>
                    <p><strong>Mín:</strong> ${minTemp} °C | <strong>Máx:</strong> ${maxTemp} °C</p>
                    <p><strong>Previsão:</strong> ${condition}</p>
                </div>
            `;
        } catch (error) {
            console.error(`Erro ao carregar o clima de ${city.name}`);
        }
    }
}

// --- 3. ADICIONAR E REMOVER CIDADES (Com Sigla do Estado) ---

// Dicionário para traduzir o Estado para Sigla
const estadosBR = {
    "Acre": "AC", "Alagoas": "AL", "Amapá": "AP", "Amazonas": "AM",
    "Bahia": "BA", "Ceará": "CE", "Distrito Federal": "DF", "Espírito Santo": "ES",
    "Goiás": "GO", "Maranhão": "MA", "Mato Grosso": "MT", "Mato Grosso do Sul": "MS",
    "Minas Gerais": "MG", "Pará": "PA", "Paraíba": "PB", "Paraná": "PR",
    "Pernambuco": "PE", "Piauí": "PI", "Rio de Janeiro": "RJ", "Rio Grande do Norte": "RN",
    "Rio Grande do Sul": "RS", "Rondônia": "RO", "Roraima": "RR", "Santa Catarina": "SC",
    "São Paulo": "SP", "Sergipe": "SE", "Tocantins": "TO"
};

async function addNewCity() {
    const input = document.getElementById('city-input');
    const errorMsg = document.getElementById('city-error');
    const cityName = input.value.trim();

    if (!cityName) return;

    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=pt&format=json`;
    
    try {
        const response = await fetch(geoUrl);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            const loc = data.results[0];
            let ufOuPais = loc.admin1; // Por padrão, pega a região/estado

            // Verifica se é no Brasil e se o estado está na nossa lista de siglas
            if (loc.country_code === "BR" && estadosBR[loc.admin1]) {
                ufOuPais = estadosBR[loc.admin1];
            } else if (loc.country_code !== "BR") {
                // Se não for no Brasil, usa a sigla do país (ex: PT, US, GB)
                ufOuPais = loc.country_code;
            }

            const newCity = {
                id: Date.now(), 
                name: `${loc.name}${ufOuPais ? ', ' + ufOuPais : ''}`, 
                lat: loc.latitude,
                lon: loc.longitude
            };

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
fetchNews();
renderWeather();

// Permite adicionar cidade apertando a tecla "Enter"
document.getElementById('city-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        addNewCity();
    }
});