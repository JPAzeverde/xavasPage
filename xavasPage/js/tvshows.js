/**
 * xavasPage — TV Shows / Media Module
 * Codename: ARCHIVE
 * Manages films, series, anime, books, comics etc.
 */

const STORAGE_KEY_SHOWS = 'xavas_shows';

const DEFAULT_SHOWS = [
  {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36),
    name: "Breaking Bad",
    cover: "https://picsum.photos/id/1005/200/300",
    year: 2008,
    language: "English",
    score: 98,
    type: "Series",
    status: "Completed"
  },
  {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36),
    name: "Attack on Titan",
    cover: "https://picsum.photos/id/1012/200/300",
    year: 2013,
    language: "Japanese",
    score: 93,
    type: "Anime",
    status: "In Progress"
  },
  {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36),
    name: "Dune (Book)",
    cover: "https://picsum.photos/id/102/200/300",
    year: 1965,
    language: "English",
    score: 95,
    type: "Book",
    status: "To Watch/Read"
  },
  {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36),
    name: "Batman: The Killing Joke",
    cover: "https://picsum.photos/id/103/200/300",
    year: 1988,
    language: "English",
    score: 88,
    type: "Comic",
    status: "Dropped"
  }
];

const MEDIA_TYPES = [
  "Film", "Series", "Anime", "Cartoon", "Manga", "Book", "Comic", "Documentary", "Other"
];

// ---------- State ----------
let shows = [];
let activeTab = 'In Progress';
let editingShowId = null;

// ---------- Data management ----------
function loadShows() {
  const raw = localStorage.getItem(STORAGE_KEY_SHOWS);
  if (raw) {
    try {
      shows = JSON.parse(raw);
    } catch(e) {
      shows = [];
    }
  } else {
    shows = [...DEFAULT_SHOWS];
    saveShows();
  }
}

function saveShows() {
  localStorage.setItem(STORAGE_KEY_SHOWS, JSON.stringify(shows));
}

function getShowsByStatus(status) {
  return shows.filter(s => s.status === status);
}

// ---------- Rendering ----------
function renderTabs(containerId = 'showsTabs') {
  const container = document.getElementById(containerId);
  const tabs = ['In Progress', 'Completed', 'To Watch/Read', 'Dropped'];
  container.innerHTML = tabs.map(tab => `
    <button class="tab ${tab === activeTab ? 'active' : ''}" data-tab="${tab}">
      ${tab.toUpperCase()}
    </button>
  `).join('');

  container.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      renderTabs(containerId);
      renderShowsGrid();
    });
  });
}

function renderShowsGrid(containerId = 'showsGrid') {
  const container = document.getElementById(containerId);
  const filtered = getShowsByStatus(activeTab);
  if (filtered.length === 0) {
    container.innerHTML = `<div class="shows-empty empty-state"><p>No intel in this sector, Commander.</p></div>`;
    return;
  }

  container.innerHTML = filtered.map(show => `
    <div class="show-card" data-id="${show.id}">
      <img src="${show.cover}" alt="${show.name}" class="show-cover" onerror="this.src='https://via.placeholder.com/200x150/1a1f22/3cb371?text=NO+IMAGE'">
      <div class="show-info">
        <div class="show-name" title="${show.name}">${show.name}</div>
        <div class="show-meta">
          <span>${show.type} · ${show.language}</span>
          <span class="show-score">${show.score}/100</span>
        </div>
        <span class="badge ${getStatusBadgeClass(show.status)}">${show.status}</span>
      </div>
      <div class="show-actions">
        <button class="btn btn-ghost btn-sm edit-show" data-id="${show.id}">&#x270E; EDIT</button>
        <button class="btn btn-ghost btn-sm delete-show" data-id="${show.id}">&#x1F5D1; DELETE</button>
      </div>
    </div>
  `).join('');

  // Attach events
  container.querySelectorAll('.edit-show').forEach(btn => {
    btn.addEventListener('click', () => openShowModal(btn.dataset.id));
  });
  container.querySelectorAll('.delete-show').forEach(btn => {
    btn.addEventListener('click', () => deleteShow(btn.dataset.id));
  });
}

function getStatusBadgeClass(status) {
  const map = {
    'In Progress': 'badge-accent',
    'Completed': 'badge-success',
    'To Watch/Read': 'badge-warning',
    'Dropped': 'badge-danger'
  };
  return map[status] || 'badge-muted';
}

// ---------- Modal ----------
function openShowModal(showId = null) {
  editingShowId = showId;
  const modal = document.getElementById('showModal');
  const form = document.getElementById('showForm');
  form.reset();

  if (showId) {
    const show = shows.find(s => s.id === showId);
    if (show) {
      document.getElementById('showName').value = show.name;
      document.getElementById('showCover').value = show.cover;
      document.getElementById('showYear').value = show.year;
      document.getElementById('showLanguage').value = show.language;
      document.getElementById('showScore').value = show.score;
      document.getElementById('showScoreValue').textContent = show.score;
      document.getElementById('showType').value = show.type;
      document.getElementById('showStatus').value = show.status;
      document.getElementById('modalTitle').textContent = 'EDIT INTEL';
    }
  } else {
    document.getElementById('modalTitle').textContent = 'NEW INTEL';
    document.getElementById('showScoreValue').textContent = '50';
    document.getElementById('showStatus').value = 'To Watch/Read';
  }

  modal.classList.remove('hidden');
}

function closeShowModal() {
  document.getElementById('showModal').classList.add('hidden');
  editingShowId = null;
}

function handleShowSubmit(e) {
  e.preventDefault();

  const showData = {
    name: document.getElementById('showName').value.trim(),
    cover: document.getElementById('showCover').value.trim(),
    year: parseInt(document.getElementById('showYear').value),
    language: document.getElementById('showLanguage').value.trim(),
    score: parseInt(document.getElementById('showScore').value),
    type: document.getElementById('showType').value,
    status: document.getElementById('showStatus').value
  };

  if (!showData.name || !showData.year || !showData.type) {
    alert('Name, Year and Type are required fields, soldier.');
    return;
  }

  if (editingShowId) {
    const idx = shows.findIndex(s => s.id === editingShowId);
    if (idx !== -1) shows[idx] = { ...shows[idx], ...showData };
  } else {
    const newShow = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36),
      ...showData
    };
    shows.push(newShow);
  }

  saveShows();
  closeShowModal();
  renderShowsGrid();
}

function deleteShow(id) {
  if (!confirm('Confirm deletion. This intel will be permanently wiped.')) return;
  shows = shows.filter(s => s.id !== id);
  saveShows();
  renderShowsGrid();
}

// ---------- Live score ----------
function setupScoreSlider() {
  const slider = document.getElementById('showScore');
  const display = document.getElementById('showScoreValue');
  if (slider && display) {
    slider.addEventListener('input', () => {
      display.textContent = slider.value;
    });
  }
}

// ---------- Initialization ----------
function initShowsPage() {
  loadShows();
  renderTabs('showsTabs');
  renderShowsGrid('showsGrid');

  document.getElementById('addShowBtn').addEventListener('click', () => openShowModal());
  document.getElementById('closeModalBtn').addEventListener('click', closeShowModal);
  document.getElementById('showForm').addEventListener('submit', handleShowSubmit);

  document.getElementById('showModal')?.addEventListener('click', function(e) {
    if (e.target === this) closeShowModal();
  });

  setupScoreSlider();
}

document.addEventListener('DOMContentLoaded', initShowsPage);