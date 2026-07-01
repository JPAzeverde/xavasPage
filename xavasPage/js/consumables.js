/**
 * xavasPage — Consumables Module
 * Codename: SUPPLY LINE
 * Tracks consumable items with depletion prediction.
 */

const STORAGE_KEY_CONSUMABLES = 'xavas_consumables';
const STORAGE_KEY_CONSUMABLE_HISTORY = 'xavas_consumable_history';

const DEFAULT_ITEMS = [
  {
    id: 'c1',
    name: 'Protein Powder',
    brand: 'Growth',
    quantity: '900g',
    openedDate: '2026-06-15',
    predictedEnd: '2026-07-05',
    finishedDate: null
  },
  {
    id: 'c2',
    name: 'Coffee Beans',
    brand: 'Orfeu',
    quantity: '250g',
    openedDate: '2026-06-20',
    predictedEnd: '2026-07-10',
    finishedDate: null
  },
  {
    id: 'c3',
    name: 'Ammo 9mm',
    brand: 'Federal',
    quantity: '50 units',
    openedDate: '2026-06-01',
    predictedEnd: '2026-07-02',
    finishedDate: null
  }
];

// ---------- State ----------
let items = [];
let history = {}; // key: "name::brand" -> array of durations in days
let activeTab = 'Running Low';
let editingItemId = null;
let selectedExistingItem = null; // for "New From Existing"

// ---------- Helpers ----------
const productKey = (name, brand) => `${name.trim().toLowerCase()}::${brand.trim().toLowerCase()}`;

function getStatus(item) {
  if (item.finishedDate) return 'Depleted';
  if (!item.predictedEnd) return 'In Stock';
  const today = new Date();
  today.setHours(0,0,0,0);
  const end = new Date(item.predictedEnd);
  end.setHours(0,0,0,0);
  const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
  return diffDays <= 3 ? 'Running Low' : 'In Stock'; // Running Low se vencer em até 3 dias (ou já vencido)
}

// ---------- Data management ----------
function loadData() {
  const rawItems = localStorage.getItem(STORAGE_KEY_CONSUMABLES);
  if (rawItems) {
    try { items = JSON.parse(rawItems); } catch(e) { items = []; }
  } else {
    items = [...DEFAULT_ITEMS];
    saveItems();
  }

  const rawHistory = localStorage.getItem(STORAGE_KEY_CONSUMABLE_HISTORY);
  if (rawHistory) {
    try { history = JSON.parse(rawHistory); } catch(e) { history = {}; }
  } else {
    history = {};
  }
}

function saveItems() {
  localStorage.setItem(STORAGE_KEY_CONSUMABLES, JSON.stringify(items));
}

function saveHistory() {
  localStorage.setItem(STORAGE_KEY_CONSUMABLE_HISTORY, JSON.stringify(history));
}

function getItemsByTab(tab) {
  return items.filter(item => getStatus(item) === tab);
}

async function calculatePredictedEnd(name, brand, openedDateStr) {
  const key = productKey(name, brand);
  const durations = await api.getConsumableHistory(key);
  if (!durations || durations.length === 0) return null;
  const avgDays = Math.round(durations.reduce((a,b) => a + b, 0) / durations.length);
  const opened = new Date(openedDateStr);
  opened.setDate(opened.getDate() + avgDays);
  return opened.toISOString().split('T')[0];
}

// ---------- Rendering ----------
function renderTabs() {
  const container = document.getElementById('consumablesTabs');
  const tabs = ['Running Low', 'In Stock', 'Depleted'];
  container.innerHTML = tabs.map(tab => `
    <button class="tab ${tab === activeTab ? 'active' : ''}" data-tab="${tab}">
      ${tab.toUpperCase()}
    </button>
  `).join('');
  container.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      renderTabs();
      renderGrid();
    });
  });
}

function renderGrid() {
  const grid = document.getElementById('supplyGrid');
  const filtered = getItemsByTab(activeTab);
  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><p>No supplies in this sector.</p></div>`;
    return;
  }

  grid.innerHTML = filtered.map(item => {
    const status = getStatus(item);
    let statusBadge = '';
    if (status === 'Running Low') statusBadge = '<span class="badge badge-danger">LOW</span>';
    else if (status === 'Depleted') statusBadge = '<span class="badge badge-muted">DEPLETED</span>';
    else statusBadge = '<span class="badge badge-success">STOCK</span>';

    const datesHtml = `
      <div class="supply-dates">
        Opened: ${item.openedDate || '—'}<br>
        ${item.predictedEnd ? 'Pred. End: ' + item.predictedEnd : ''}
        ${item.finishedDate ? '<br>Finished: ' + item.finishedDate : ''}
      </div>
    `;

    const actionsHtml = item.finishedDate ? '' : `
      <div class="supply-actions">
        <button class="btn btn-ghost btn-sm edit-item" data-id="${item.id}">&#x270E; EDIT</button>
        <div class="finished-checkbox">
          <input type="checkbox" class="mark-finished" data-id="${item.id}" id="fin-${item.id}">
          <label for="fin-${item.id}">FINISHED</label>
        </div>
      </div>
    `;

    return `
      <div class="supply-card ${item.finishedDate ? 'depleted' : ''}">
        <div class="supply-name">${item.name}</div>
        <div class="supply-meta">
          <span>${item.brand}</span>
          <span>${item.quantity}</span>
        </div>
        ${datesHtml}
        ${statusBadge}
        ${actionsHtml}
      </div>
    `;
  }).join('');

  // Attach events
  grid.querySelectorAll('.edit-item').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.id));
  });
  grid.querySelectorAll('.mark-finished').forEach(cb => {
    cb.addEventListener('change', function() {
      if (this.checked) markAsFinished(this.dataset.id, this);
    });
  });
}
async function markAsFinished(itemId, checkbox) {
  const todayStr = new Date().toISOString().split('T')[0];
  const dateStr = prompt('Confirm finish date (YYYY-MM-DD):', todayStr);
  if (!dateStr) { checkbox.checked = false; return; }

  const item = items.find(i => i.id === itemId);
  if (!item) return;

  item.finishedDate = dateStr;
  await api.updateConsumable(item); // atualiza no backend

  if (item.openedDate) {
    const opened = new Date(item.openedDate);
    const finished = new Date(dateStr);
    const durationDays = Math.round((finished - opened) / (1000 * 60 * 60 * 24));
    if (durationDays > 0) {
      const key = productKey(item.name, item.brand);
      await api.addConsumableHistory(key, durationDays);
    }
  }

  await loadConsumables(); // recarrega
  renderGrid();
  renderTabs();
}

// ---------- Modais ----------
function openEditModal(itemId) {
  editingItemId = itemId;
  const item = items.find(i => i.id === itemId);
  if (!item) return;

  document.getElementById('editItemName').value = item.name;
  document.getElementById('editItemBrand').value = item.brand;
  document.getElementById('editItemQuantity').value = item.quantity;
  document.getElementById('editItemOpenedDate').value = item.openedDate;
  updatePredictedEndDisplay(); // mostrar predictedEnd atual
  document.getElementById('editModalTitle').textContent = 'EDIT SUPPLY ITEM';
  document.getElementById('editItemModal').classList.remove('hidden');

  // Ao alterar openedDate, recalcular predictedEnd
  document.getElementById('editItemOpenedDate').addEventListener('input', updatePredictedEndDisplay);
}

function updatePredictedEndDisplay() {
  const name = document.getElementById('editItemName').value;
  const brand = document.getElementById('editItemBrand').value;
  const opened = document.getElementById('editItemOpenedDate').value;
  const predicted = calculatePredictedEnd(name, brand, opened);
  const display = document.getElementById('editPredictedEnd');
  display.textContent = predicted || '— (insufficient data)';
}

function closeEditModal() {
  document.getElementById('editItemModal').classList.add('hidden');
  editingItemId = null;
}

function handleEditSubmit(e) {
  e.preventDefault();
  if (!editingItemId) return;

  const item = items.find(i => i.id === editingItemId);
  if (!item) return;

  const openedDate = document.getElementById('editItemOpenedDate').value;
  item.openedDate = openedDate;
  // Recalculate predictedEnd based on history, but keep existing if no data?
  const newPredicted = calculatePredictedEnd(item.name, item.brand, openedDate);
  if (newPredicted) item.predictedEnd = newPredicted;
  // else keep previous predictedEnd (don't change)

  saveItems();
  closeEditModal();
  renderGrid();
}

// Novo item manual
function openNewItemModal() {
  document.getElementById('newItemForm').reset();
  document.getElementById('newItemModalTitle').textContent = 'NEW SUPPLY ITEM';
  document.getElementById('newPredictedEnd').textContent = '—';
  document.getElementById('newItemModal').classList.remove('hidden');
  // Limpar listeners antigos
}

function closeNewItemModal() {
  document.getElementById('newItemModal').classList.add('hidden');
}

function handleNewItemSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('newItemName').value.trim();
  const brand = document.getElementById('newItemBrand').value.trim();
  const quantity = document.getElementById('newItemQuantity').value.trim();
  const openedDate = document.getElementById('newItemOpenedDate').value;

  if (!name || !quantity || !openedDate) {
    alert('Name, Quantity and Opened Date are mandatory.');
    return;
  }

  const predicted = calculatePredictedEnd(name, brand, openedDate);
  const newItem = {
    id: 'c' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
    name,
    brand,
    quantity,
    openedDate,
    predictedEnd: predicted || '',
    finishedDate: null
  };
  items.push(newItem);
  saveItems();
  closeNewItemModal();
  renderGrid();
  renderTabs();
}

// "New From Existing"
function openExistingModal() {
  document.getElementById('existingSearch').value = '';
  document.getElementById('existingResults').innerHTML = '';
  document.getElementById('existingModal').classList.remove('hidden');
}

function closeExistingModal() {
  document.getElementById('existingModal').classList.add('hidden');
}

function searchExisting(query) {
  const resultsDiv = document.getElementById('existingResults');
  const q = query.toLowerCase();
  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(q) || i.brand.toLowerCase().includes(q)
  );
  if (filtered.length === 0) {
    resultsDiv.innerHTML = '<div class="search-item">No matches found.</div>';
    return;
  }
  resultsDiv.innerHTML = filtered.map(i => `
    <div class="search-item" data-id="${i.id}">
      ${i.name} (${i.brand}) - ${i.quantity}
    </div>
  `).join('');
  resultsDiv.querySelectorAll('.search-item[data-id]').forEach(div => {
    div.addEventListener('click', () => {
      const source = items.find(i => i.id === div.dataset.id);
      if (source) openNewFromExisting(source);
      closeExistingModal();
    });
  });
}

function openNewFromExisting(source) {
  // Preenche formulário de novo item com dados do source, mas openedDate = hoje
  document.getElementById('newItemName').value = source.name;
  document.getElementById('newItemBrand').value = source.brand;
  document.getElementById('newItemQuantity').value = source.quantity;
  document.getElementById('newItemOpenedDate').value = new Date().toISOString().split('T')[0];
  // Calcular predicted
  const predicted = calculatePredictedEnd(source.name, source.brand, document.getElementById('newItemOpenedDate').value);
  document.getElementById('newPredictedEnd').textContent = predicted || '— (insufficient data)';
  document.getElementById('newItemModalTitle').textContent = 'NEW SUPPLY ITEM (FROM EXISTING)';
  document.getElementById('newItemModal').classList.remove('hidden');
}

// ---------- Initialization ----------
function initConsumablesPage() {
  loadData();
  renderTabs();
  renderGrid();

  document.getElementById('addNewItemBtn').addEventListener('click', openNewItemModal);
  document.getElementById('addExistingItemBtn').addEventListener('click', openExistingModal);
  document.getElementById('closeNewItemModal').addEventListener('click', closeNewItemModal);
  document.getElementById('closeExistingModal').addEventListener('click', closeExistingModal);
  document.getElementById('closeEditModal').addEventListener('click', closeEditModal);
  document.getElementById('newItemForm').addEventListener('submit', handleNewItemSubmit);
  document.getElementById('editItemForm').addEventListener('submit', handleEditSubmit);
  document.getElementById('existingSearch').addEventListener('input', (e) => searchExisting(e.target.value));

  // Recalculate predicted when typing name/brand/opened in new item form
  const newName = document.getElementById('newItemName');
  const newBrand = document.getElementById('newItemBrand');
  const newOpened = document.getElementById('newItemOpenedDate');
  const updateNewPredicted = () => {
    const predicted = calculatePredictedEnd(newName.value, newBrand.value, newOpened.value);
    document.getElementById('newPredictedEnd').textContent = predicted || '— (insufficient data)';
  };
  newName.addEventListener('input', updateNewPredicted);
  newBrand.addEventListener('input', updateNewPredicted);
  newOpened.addEventListener('input', updateNewPredicted);
}

document.addEventListener('DOMContentLoaded', initConsumablesPage);