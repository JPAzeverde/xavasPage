/**
 * xavasPage — Tasks Module
 * Codename: MISSION LOG
 * Manages tasks with monthly calendar view and localStorage.
 */

const STORAGE_KEY_TASKS = 'xavas_tasks';

const DEFAULT_TASKS = [
  {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)+Math.random().toString(36),
    name: "Submit TPS report",
    tag: "freelance",
    date: new Date().toISOString().split('T')[0],
    time: "14:00",
    endDate: "",
    status: "To Do"
  },
  {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)+Math.random().toString(36),
    name: "Squad training drill",
    tag: "personal",
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time: "08:00",
    endDate: "",
    status: "In Progress"
  },
  {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)+Math.random().toString(36),
    name: "Intel review",
    tag: "unilavras",
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    time: "",
    endDate: "",
    status: "Completed"
  }
];

// ---------- State ----------
let tasks = [];
let activeTab = 'In Progress'; // status filter for calendar
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let editingTaskId = null;

// ---------- Data management ----------
function loadTasks() {
  const raw = localStorage.getItem(STORAGE_KEY_TASKS);
  if (raw) {
    try { tasks = JSON.parse(raw); } catch(e) { tasks = []; }
  } else {
    tasks = [...DEFAULT_TASKS];
    saveTasks();
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
}

function getFilteredTasks() {
  return tasks.filter(t => t.status === activeTab);
}

// ---------- Calendar helpers ----------
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  // We want Monday as first column -> day 0 (Sun) becomes 6, day 1 (Mon) becomes 0, etc.
  let day = new Date(year, month, 1).getDay();
  return (day === 0) ? 6 : day - 1; // Monday-based index
}

// ---------- Rendering ----------
function renderTabs() {
  const container = document.getElementById('tasksTabs');
  const tabs = ['In Progress', 'Completed', 'To Do', 'Forgotten'];
  container.innerHTML = tabs.map(tab => `
    <button class="tab ${tab === activeTab ? 'active' : ''}" data-tab="${tab}">
      ${tab.toUpperCase()}
    </button>
  `).join('');
  container.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      renderTabs();
      renderCalendar();
    });
  });
}

function renderCalendar() {
  const grid = document.getElementById('calendarGrid');
  const monthLabel = document.getElementById('monthLabel');
  
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  monthLabel.textContent = `${monthNames[currentMonth]} ${currentYear}`;

  // Build header
  const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  let html = dayHeaders.map(d => `<div class="calendar-header">${d}</div>`).join('');

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7; // complete weeks

  const todayStr = new Date().toISOString().split('T')[0];
  const filteredTasks = getFilteredTasks();

  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - firstDay + 1;
    const isCurrentMonth = dayNum >= 1 && dayNum <= daysInMonth;
    const dateObj = new Date(currentYear, currentMonth, dayNum);
    const dateStr = dateObj.toISOString().split('T')[0];
    const isToday = dateStr === todayStr;

    let cellClass = 'calendar-cell';
    if (!isCurrentMonth) cellClass += ' other-month';
    if (isToday) cellClass += ' today';

    let dayTasksHtml = '';
    if (isCurrentMonth) {
      const dayTasks = filteredTasks.filter(t => t.date === dateStr);
      dayTasksHtml = dayTasks.map(task => {
        const statusClass = `status-${task.status.replace(/\s+/g, '-')}`;
        return `<div class="task-item ${statusClass}" data-id="${task.id}" title="${task.name} (${task.tag})">${task.name}</div>`;
      }).join('');
    }

    html += `<div class="${cellClass}" data-date="${isCurrentMonth ? dateStr : ''}">
      <div class="cell-date">${isCurrentMonth ? dayNum : ''}</div>
      ${dayTasksHtml}
    </div>`;
  }

  grid.innerHTML = html;

  // Add click listeners
  grid.querySelectorAll('.calendar-cell[data-date]').forEach(cell => {
    cell.addEventListener('click', (e) => {
      if (e.target.classList.contains('task-item')) {
        // Edit task
        const taskId = e.target.dataset.id;
        openTaskModal(taskId);
      } else {
        // Open modal with date pre-filled
        const date = cell.dataset.date;
        if (date) openTaskModal(null, date);
      }
    });
  });
}

function navigateMonth(delta) {
  currentMonth += delta;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  } else if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar();
}

// ---------- Modal ----------
function openTaskModal(taskId = null, prefillDate = null) {
  editingTaskId = taskId;
  const modal = document.getElementById('taskModal');
  const form = document.getElementById('taskForm');
  const deleteBtn = document.getElementById('deleteTaskBtn');

  if (deleteBtn) {
    deleteBtn.style.display = editingTaskId ? 'block' : 'none';
  }

  form.reset();

  if (taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      document.getElementById('taskName').value = task.name;
      document.getElementById('taskTag').value = task.tag;
      document.getElementById('taskDate').value = task.date;
      document.getElementById('taskTime').value = task.time || '';
      document.getElementById('taskEndDate').value = task.endDate || '';
      document.getElementById('taskStatus').value = task.status;
      document.getElementById('modalTitle').textContent = 'EDIT MISSION';
    }
  } else {
    document.getElementById('modalTitle').textContent = 'NEW MISSION';
    document.getElementById('taskStatus').value = activeTab;
    if (prefillDate) {
      document.getElementById('taskDate').value = prefillDate;
    } else {
      document.getElementById('taskDate').value = new Date().toISOString().split('T')[0];
    }
  }

  modal.classList.remove('hidden');
}

function closeTaskModal() {
  document.getElementById('taskModal').classList.add('hidden');
  editingTaskId = null;
}

function handleTaskSubmit(e) {
  e.preventDefault();

  const taskData = {
    name: document.getElementById('taskName').value.trim(),
    tag: document.getElementById('taskTag').value.trim(),
    date: document.getElementById('taskDate').value,
    time: document.getElementById('taskTime').value,
    endDate: document.getElementById('taskEndDate').value,
    status: document.getElementById('taskStatus').value
  };

  if (!taskData.name || !taskData.date) {
    alert('Name and Date are mandatory, soldier.');
    return;
  }

  if (editingTaskId) {
    const idx = tasks.findIndex(t => t.id === editingTaskId);
    if (idx !== -1) tasks[idx] = { ...tasks[idx], ...taskData };
  } else {
    const newTask = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)+Math.random().toString(36),
      ...taskData
    };
    tasks.push(newTask);
  }

  saveTasks();
  closeTaskModal();
  renderCalendar();
}

function deleteTask(id) {
  if (!confirm('Confirm mission abort?')) return;
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderCalendar();
}

// ---------- Initialization ----------
function initTasksPage() {
  loadTasks();
  renderTabs();
  renderCalendar();

  document.getElementById('addTaskBtn').addEventListener('click', () => openTaskModal());
  document.getElementById('prevMonthBtn').addEventListener('click', () => navigateMonth(-1));
  document.getElementById('nextMonthBtn').addEventListener('click', () => navigateMonth(1));
  document.getElementById('closeModalBtn').addEventListener('click', closeTaskModal);
  document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);

  document.getElementById('taskModal')?.addEventListener('click', function(e) {
    if (e.target === this) closeTaskModal();
  });

  // Delete button inside modal (if editing)
  document.getElementById('deleteTaskBtn')?.addEventListener('click', () => {
    if (editingTaskId) {
      deleteTask(editingTaskId);
      closeTaskModal();
    }
  });
}

document.addEventListener('DOMContentLoaded', initTasksPage);