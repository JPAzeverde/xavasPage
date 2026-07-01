/**
 * xavasPage — Games Module
 * Codename: ARMORY
 * Manages game entries with localStorage persistence.
 */

const STORAGE_KEY_GAMES = 'xavas_games';

// ---------- Default seed data ----------
const DEFAULT_GAMES = [
  {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36),
    name: "Elden Ring",
    cover: "https://picsum.photos/id/1015/200/300",
    year: 2022,
    platform: "PC",
    emulator: false,
    score: 95,
    status: "In Progress"
  },
  {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36),
    name: "The Legend of Zelda: Tears of the Kingdom",
    cover: "https://picsum.photos/id/1043/200/300",
    year: 2023,
    platform: "Switch",
    emulator: false,
    score: 97,
    status: "To Play"
  },
  {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36),
    name: "Hollow Knight",
    cover: "https://picsum.photos/id/106/200/300",
    year: 2017,
    platform: "PC",
    emulator: false,
    score: 90,
    status: "Completed"
  },
  {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36),
    name: "Cyberpunk 2077",
    cover: "https://picsum.photos/id/100/200/300",
    year: 2020,
    platform: "PS4",
    emulator: false,
    score: 60,
    status: "Dropped"
  }
];

const PLATFORM_SUGGESTIONS = [
  "PC", "PS4", "PS5", "Xbox One", "Xbox Series X/S", "Nintendo Switch",
  "Nintendo 64", "GameCube", "Wii", "Wii U", "Game Boy", "Game Boy Advance",
  "Nintendo DS", "Nintendo 3DS", "PSP", "PS Vita", "Mobile", "Browser", "Other"
];

// ---------- State ----------
let games = [];
let activeTab = 'In Progress';
let editingGameId = null; // null = adding new

// ---------- Data management ----------
async function loadGames() {
  try {
    games = await api.getGames();
  } catch (err) {
    console.error('Failed to load games:', err);
    games = []; // fallback vazio
  }
}


function getGamesByStatus(status) {
  return games.filter(g => g.status === status);
}

// ---------- Rendering ----------
function renderTabs(containerId = 'gamesTabs') {
  const container = document.getElementById(containerId);
  const tabs = ['In Progress', 'Completed', 'To Play', 'Dropped'];
  container.innerHTML = tabs.map(tab => `
    <button class="tab ${tab === activeTab ? 'active' : ''}" data-tab="${tab}">
      ${tab.toUpperCase()}
    </button>
  `).join('');

  container.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      renderTabs(containerId);
      renderGamesGrid();
    });
  });
}

function renderGamesGrid(containerId = 'gamesGrid') {
  const container = document.getElementById(containerId);
  const filtered = getGamesByStatus(activeTab);
  if (filtered.length === 0) {
    container.innerHTML = `<div class="games-empty empty-state"><p>No operations in this sector, Commander.</p></div>`;
    return;
  }

  container.innerHTML = filtered.map(game => `
    <div class="game-card" data-id="${game.id}">
      <img src="${game.cover}" alt="${game.name}" class="game-cover" onerror="this.src='https://via.placeholder.com/200x150/1a1f22/3cb371?text=NO+IMAGE'">
      <div class="game-info">
        <div class="game-name" title="${game.name}">${game.name}</div>
        <div class="game-meta">
          <span>${game.platform}${game.emulator ? ' (EMU)' : ''}</span>
          <span class="game-score">${game.score}/100</span>
        </div>
        <span class="badge ${getStatusBadgeClass(game.status)}">${game.status}</span>
      </div>
      <div class="game-actions">
        <button class="btn btn-ghost btn-sm edit-game" data-id="${game.id}">&#x270E; EDIT</button>
        <button class="btn btn-ghost btn-sm delete-game" data-id="${game.id}">&#x1F5D1; DELETE</button>
      </div>
    </div>
  `).join('');

  // Attach events
  container.querySelectorAll('.edit-game').forEach(btn => {
    btn.addEventListener('click', () => openGameModal(btn.dataset.id));
  });
  container.querySelectorAll('.delete-game').forEach(btn => {
    btn.addEventListener('click', () => deleteGame(btn.dataset.id));
  });
}

function getStatusBadgeClass(status) {
  const map = {
    'In Progress': 'badge-accent',
    'Completed': 'badge-success',
    'To Play': 'badge-warning',
    'Dropped': 'badge-danger'
  };
  return map[status] || 'badge-muted';
}

// ---------- Modal logic ----------
function openGameModal(gameId = null) {
  editingGameId = gameId;
  const modal = document.getElementById('gameModal');
  const form = document.getElementById('gameForm');
  form.reset();

  if (gameId) {
    const game = games.find(g => g.id === gameId);
    if (game) {
      document.getElementById('gameName').value = game.name;
      document.getElementById('gameCover').value = game.cover;
      document.getElementById('gameYear').value = game.year;
      document.getElementById('gamePlatform').value = game.platform;
      document.getElementById('gameEmulator').checked = game.emulator;
      document.getElementById('gameScore').value = game.score;
      document.getElementById('gameScoreValue').textContent = game.score;
      document.getElementById('gameStatus').value = game.status;
      document.getElementById('modalTitle').textContent = 'EDIT OPERATION';
    }
  } else {
    document.getElementById('modalTitle').textContent = 'NEW OPERATION';
    // Set default values
    document.getElementById('gameScoreValue').textContent = '50';
    document.getElementById('gameStatus').value = 'To Play';
  }

  modal.classList.remove('hidden');
}

function closeGameModal() {
  document.getElementById('gameModal').classList.add('hidden');
  editingGameId = null;
}

async function handleGameSubmit(e) {
  e.preventDefault();

  const gameData = {
    name: document.getElementById('gameName').value.trim(),
    cover: document.getElementById('gameCover').value.trim(),
    year: parseInt(document.getElementById('gameYear').value),
    platform: document.getElementById('gamePlatform').value.trim(),
    emulator: document.getElementById('gameEmulator').checked,
    score: parseInt(document.getElementById('gameScore').value),
    status: document.getElementById('gameStatus').value
  };

  try {
    if (editingGameId) {
      await api.updateGame({ ...gameData, ID: editingGameId });
    } else {
      gameData.ID = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36);
      await api.addGame(gameData);
    }
    await loadGames(); // recarrega da API
    renderGamesGrid();
  } catch (err) {
    alert('Operation failed, soldier. Check connection.');
  }
}

// Ao deletar:
async function deleteGame(id) {
  if (!confirm('Confirm deletion?')) return;
  try {
    await api.deleteGame(id);
    await loadGames();
    renderGamesGrid();
  } catch (err) {
    alert('Failed to delete game.');
  }
}

// ---------- Live score display ----------
function setupScoreSlider() {
  const slider = document.getElementById('gameScore');
  const display = document.getElementById('gameScoreValue');
  if (slider && display) {
    slider.addEventListener('input', () => {
      display.textContent = slider.value;
    });
  }
}

// ---------- Initialization ----------
function initGamesPage() {
  await loadGames();

  renderTabs('gamesTabs');
  renderGamesGrid('gamesGrid');

  // Add game button
  document.getElementById('addGameBtn').addEventListener('click', () => openGameModal());

  // Modal close & submit
  document.getElementById('closeModalBtn').addEventListener('click', closeGameModal);
  document.getElementById('gameForm').addEventListener('submit', handleGameSubmit);

  // Close on overlay click
  document.getElementById('gameModal')?.addEventListener('click', function(e) {
    if (e.target === this) closeGameModal();
  });

  setupScoreSlider();
}

// Auto-initialize when DOM ready (called from games.html)
document.addEventListener('DOMContentLoaded', initGamesPage);