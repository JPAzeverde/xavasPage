/**
 * xavasPage — Weekly Protocol Module
 * Codename: ROUTINE
 * Manages recurring weekly activities with daily checklist.
 */

const STORAGE_KEY_PROTOCOL = 'xavas_protocol';
const STORAGE_KEY_COMPLETED = 'xavas_protocol_completed';

const DEFAULT_PROTOCOLS = [
  { id: 'p1', name: 'Morning PT', tag: 'health', day: 'Monday', start: '06:00', end: '07:00' },
  { id: 'p2', name: 'Tactical Briefing', tag: 'work', day: 'Monday', start: '08:00', end: '09:00' },
  { id: 'p3', name: 'Code Review', tag: 'unilavras', day: 'Wednesday', start: '10:00' },
  { id: 'p4', name: 'Gear Maintenance', tag: 'personal', day: 'Thursday', start: '18:00', end: '19:00' },
  { id: 'p5', name: 'Night Watch', tag: 'personal', day: 'Saturday', start: '22:00' },
  { id: 'p6', name: 'Supply Check', tag: 'personal', day: 'Friday', start: '12:00' }
];

// ---------- State ----------
let protocols = [];
let completedToday = {}; // map of protocolId -> true/false
let editingProtocolId = null;

// ---------- Helpers ----------
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getTodayName() {
  return DAYS_OF_WEEK[new Date().getDay()];
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

// ---------- Data management ----------
function loadProtocols() {
  const raw = localStorage.getItem(STORAGE_KEY_PROTOCOL);
  if (raw) {
    try { protocols = JSON.parse(raw); } catch(e) { protocols = []; }
  } else {
    protocols = [...DEFAULT_PROTOCOLS];
    saveProtocols();
  }
}

function saveProtocols() {
  localStorage.setItem(STORAGE_KEY_PROTOCOL, JSON.stringify(protocols));
}

function loadCompleted() {
  const raw = localStorage.getItem(STORAGE_KEY_COMPLETED);
  if (raw) {
    try { completedToday = JSON.parse(raw); } catch(e) { completedToday = {}; }
  } else {
    completedToday = {};
  }
}

function saveCompleted() {
  localStorage.setItem(STORAGE_KEY_COMPLETED, JSON.stringify(completedToday));
}

// Check if we need to reset daily completions (new day)
function resetCompletedIfNewDay() {
  const storedDate = localStorage.getItem('xavas_protocol_date');
  const today = getTodayStr();
  if (storedDate !== today) {
    localStorage.setItem('xavas_protocol_date', today);
    completedToday = {};
    saveCompleted();
  }
}

// ---------- Rendering ----------
function renderTodayProtocol() {
  const container = document.getElementById('todayProtocolList');
  const today = getTodayName();
  const todayProtocols = protocols.filter(p => p.day === today);
  
  if (todayProtocols.length === 0) {
    container.innerHTML = '<div class="empty-protocol">No missions scheduled for today. Stand down.</div>';
    return;
  }

  container.innerHTML = todayProtocols.map(p => {
    const isChecked = completedToday[p.id] === true;
    const timeStr = p.end ? `${p.start} - ${p.end}` : p.start;
    return `
      <li class="checklist-item ${isChecked ? 'completed' : ''}" data-id="${p.id}">
        <input type="checkbox" ${isChecked ? 'checked' : ''} class="protocol-checkbox">
        <label>
          <span>${p.name}</span>
          <span class="checklist-time">${timeStr}</span>
          <span class="checklist-tag">${p.tag}</span>
        </label>
      </li>
    `;
  }).join('');

  // Attach events
  container.querySelectorAll('.protocol-checkbox').forEach(cb => {
    cb.addEventListener('change', function(e) {
      const li = this.closest('.checklist-item');
      const id = li.dataset.id;
      if (this.checked) {
        completedToday[id] = true;
        li.classList.add('completed');
      } else {
        delete completedToday[id];
        li.classList.remove('completed');
      }
      saveCompleted();
    });
  });
}

function renderWeeklyProtocol() {
  const container = document.getElementById('weeklyProtocolContainer');
  const grouped = {};
  DAYS_OF_WEEK.forEach(day => grouped[day] = []);
  protocols.forEach(p => {
    if (grouped[p.day]) grouped[p.day].push(p);
  });

  container.innerHTML = DAYS_OF_WEEK.map(day => {
    const items = grouped[day];
    let contentHtml = '';
    if (items.length === 0) {
      contentHtml = '<span class="empty-protocol" style="padding:0;">—</span>';
    } else {
      contentHtml = items.map(p => {
        const timeStr = p.end ? `${p.start}-${p.end}` : p.start;
        return `<span class="protocol-badge">
            ${p.name} <span class="time">${timeStr}</span> (${p.tag})
            <button class="btn-edit-item" data-id="${p.id}" style="background:none;border:none;color:var(--text-muted);cursor:pointer;padding:0 2px;">&#x270E;</button>
        </span>`;
        }).join('');
    }
    return `
      <div class="day-row">
        <div class="day-label">${day.substring(0,3).toUpperCase()}</div>
        <div class="day-content">${contentHtml}</div>
      </div>
    `;
  }).join('');
}

// ---------- Modal ----------
function openProtocolModal(id = null) {
  editingProtocolId = id;
  const modal = document.getElementById('protocolModal');
  const form = document.getElementById('protocolForm');
  form.reset();

  if (id) {
    const protocol = protocols.find(p => p.id === id);
    if (protocol) {
      document.getElementById('protocolName').value = protocol.name;
      document.getElementById('protocolTag').value = protocol.tag;
      document.getElementById('protocolDay').value = protocol.day;
      document.getElementById('protocolStart').value = protocol.start;
      document.getElementById('protocolEnd').value = protocol.end || '';
      document.getElementById('modalTitle').textContent = 'EDIT ROUTINE ITEM';
    }
  } else {
    document.getElementById('modalTitle').textContent = 'NEW ROUTINE ITEM';
  }

  const deleteBtn = document.getElementById('deleteProtocolBtn');
  if (deleteBtn) deleteBtn.style.display = editingProtocolId ? 'block' : 'none';

  modal.classList.remove('hidden');
}

function closeProtocolModal() {
  document.getElementById('protocolModal').classList.add('hidden');
  editingProtocolId = null;
}

function handleProtocolSubmit(e) {
  e.preventDefault();

  const data = {
    name: document.getElementById('protocolName').value.trim(),
    tag: document.getElementById('protocolTag').value.trim(),
    day: document.getElementById('protocolDay').value,
    start: document.getElementById('protocolStart').value,
    end: document.getElementById('protocolEnd').value || ''
  };

  if (!data.name || !data.day || !data.start) {
    alert('Name, Day and Start time are mandatory.');
    return;
  }

  if (editingProtocolId) {
    const idx = protocols.findIndex(p => p.id === editingProtocolId);
    if (idx !== -1) protocols[idx] = { ...protocols[idx], ...data };
  } else {
    const newItem = {
      id: 'p' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      ...data
    };
    protocols.push(newItem);
  }

  saveProtocols();
  closeProtocolModal();
  refreshAllViews();
}

function deleteProtocol(id) {
  if (!confirm('Delete this routine item, Commander?')) return;
  protocols = protocols.filter(p => p.id !== id);
  saveProtocols();
  refreshAllViews();
}

function refreshAllViews() {
  renderTodayProtocol();
  renderWeeklyProtocol();
}

// ---------- Initialization ----------
function initProtocolPage() {
  loadProtocols();
  loadCompleted();
  resetCompletedIfNewDay();
  renderTodayProtocol();
  renderWeeklyProtocol();

  document.getElementById('addProtocolBtn').addEventListener('click', () => openProtocolModal());
  document.getElementById('closeModalBtn').addEventListener('click', closeProtocolModal);
  document.getElementById('protocolForm').addEventListener('submit', handleProtocolSubmit);
  document.getElementById('deleteProtocolBtn').addEventListener('click', () => {
    if (editingProtocolId) {
      deleteProtocol(editingProtocolId);
      closeProtocolModal();
    }
  });

  document.getElementById('protocolModal')?.addEventListener('click', function(e) {
    if (e.target === this) closeProtocolModal();
  });

  document.getElementById('weeklyProtocolContainer').addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-edit-item');
    if (btn) {
        const id = btn.dataset.id;
        openProtocolModal(id);
    }
    });

}

document.addEventListener('DOMContentLoaded', initProtocolPage);