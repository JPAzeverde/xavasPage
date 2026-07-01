/**
 * xavasPage — Weather Intel
 * Codename: SKYWATCH
 * Uses wttr.in (no API key required).
 */

const DEFAULT_CITIES = ['Lavras', 'Campos Gerais'];
const STORAGE_KEY_CITIES = 'xavas_weather_cities';

function getSavedCities() {
  const raw = localStorage.getItem(STORAGE_KEY_CITIES);
  if (raw) {
    try { return JSON.parse(raw); } catch(e) {}
  }
  return [...DEFAULT_CITIES];
}

function saveCities(cities) {
  localStorage.setItem(STORAGE_KEY_CITIES, JSON.stringify(cities));
}

async function fetchWeather(city) {
  const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Weather fetch failed for ${city}`);
  const data = await resp.json();
  const current = data.current_condition[0];
  return {
    city,
    temp: parseInt(current.temp_C),
    desc: current.weatherDesc[0].value,
    humidity: current.humidity,
    windSpeed: current.windspeedKmph,
    icon: current.weatherCode // wttr.in gives a code we can map to emoji
  };
}

function weatherCodeToEmoji(code) {
  // Approximate mapping from wttr.in weatherCode
  if (code <= 200) return '⛈️';
  if (code <= 300) return '🌧️';
  if (code <= 400) return '🌦️';
  if (code <= 500) return '🌧️';
  if (code <= 600) return '❄️';
  if (code <= 700) return '🌫️';
  if (code === 800) return '☀️';
  if (code <= 802) return '⛅';
  return '☁️';
}

async function renderWeatherWidget(containerId, onRemoveCity) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const cities = getSavedCities();
  container.innerHTML = '';
  
  for (const city of cities) {
    try {
      const w = await fetchWeather(city);
      const card = document.createElement('div');
      card.className = 'weather-card';
      card.innerHTML = `
        <div class="weather-header">
          <span class="weather-city">${city}</span>
          <button class="btn-icon-small remove-city" data-city="${city}" title="Remove from recon">✕</button>
        </div>
        <div class="weather-body">
          <span class="weather-icon">${weatherCodeToEmoji(w.icon)}</span>
          <span class="weather-temp">${w.temp}°C</span>
        </div>
        <div class="weather-desc">${w.desc}</div>
      `;
      container.appendChild(card);
    } catch (err) {
      console.error(err);
      const card = document.createElement('div');
      card.className = 'weather-card error';
      card.innerHTML = `<span>${city}: intel unavailable</span>`;
      container.appendChild(card);
    }
  }

  // Add city button
  const addCard = document.createElement('div');
  addCard.className = 'weather-card add-city';
  addCard.innerHTML = `<button id="addCityBtn" class="btn btn-ghost btn-sm">+ ADD CITY</button>`;
  container.appendChild(addCard);

  // Event listeners
  document.getElementById('addCityBtn')?.addEventListener('click', () => {
    const newCity = prompt('Enter city name for weather recon:');
    if (newCity && newCity.trim()) {
      const updated = getSavedCities();
      updated.push(newCity.trim());
      saveCities(updated);
      renderWeatherWidget(containerId, onRemoveCity);
    }
  });

  container.querySelectorAll('.remove-city').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const cityToRemove = btn.dataset.city;
      const updated = getSavedCities().filter(c => c !== cityToRemove);
      saveCities(updated);
      renderWeatherWidget(containerId, onRemoveCity);
    });
  });
}