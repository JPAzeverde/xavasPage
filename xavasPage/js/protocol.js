// =========================================
// HEADER LOGIC
// =========================================
const btnMenu = document.getElementById('btn-menu');
const mainNav = document.getElementById('main-nav');
const btnLogout = document.getElementById('btn-logout');

btnMenu?.addEventListener('click', () => {
    mainNav.classList.toggle('is-open');
    btnMenu.textContent = mainNav.classList.contains('is-open') ? 'Close' : 'Menu';
});

btnLogout?.addEventListener('click', () => {
    sessionStorage.removeItem('portal_pessoal_auth');
    window.location.replace('login.html');
});

// =========================================
// STATE & STORAGE
// =========================================
const STORAGE_KEY = 'protocol_tasks';
const dayMap = { monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6 };
const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const loadTasks = () => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
};

const saveTasks = (tasks) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
};

// =========================================
// RENDER GRID
// =========================================
const renderWeek = () => {
    const grid = document.getElementById('schedule-grid');
    if (!grid) return;
    grid.innerHTML = '';

    // Coluna de Horas
    const timeCol = document.createElement('div');
    timeCol.className = 'schedule__time-col';
    timeCol.innerHTML = `<div class="schedule__header">-</div>`;
    
    for (let h = 0; h < 24; h++) {
        const cell = document.createElement('div');
        cell.className = 'schedule__cell';
        cell.dataset.hour = h;
        cell.innerHTML = `<span class="schedule__hour-label">${String(h).padStart(2, '0')}:00</span>`;
        timeCol.appendChild(cell);
    }
    grid.appendChild(timeCol);

    // Colunas dos Dias
    dayNames.forEach((dayName, index) => {
        const dayCol = document.createElement('div');
        dayCol.className = 'schedule__col';
        dayCol.id = `day${index}`;
        dayCol.innerHTML = `<div class="schedule__header">${dayName}</div>`;

        for (let h = 0; h < 24; h++) {
            const cell = document.createElement('div');
            cell.className = 'schedule__cell';
            cell.dataset.hour = h;
            dayCol.appendChild(cell);
        }
        grid.appendChild(dayCol);
    });
};

// =========================================
// POPULATE TASKS
// =========================================
const populateTasks = () => {
    const tasks = loadTasks();
    const taskCount = Array.from({ length: 7 }, () => Array(24).fill(0));

    // Conta tarefas para ajustar a altura da célula dinamicamente
    tasks.forEach(task => {
        const dayIndex = dayMap[task.day];
        if (dayIndex === undefined) return;

        const startHour = parseInt(task.startTime.split(':')[0], 10);
        const endHour = task.endTime ? parseInt(task.endTime.split(':')[0], 10) : startHour + 1;

        for (let h = startHour; h < endHour; h++) {
            if (h >= 0 && h < 24) taskCount[dayIndex][h]++;
        }
    });

    const maxTasksPerHour = Array(24).fill(0);
    for (let h = 0; h < 24; h++) {
        for (let d = 0; d < 7; d++) {
            if (taskCount[d][h] > maxTasksPerHour[h]) {
                maxTasksPerHour[h] = taskCount[d][h];
            }
        }
    }

    // Aplica altura
    for (let h = 0; h < 24; h++) {
        const height = maxTasksPerHour[h] > 0 ? maxTasksPerHour[h] * 80 : 0;
        document.querySelectorAll(`.schedule__cell[data-hour="${h}"]`).forEach(cell => {
            cell.style.height = height > 0 ? `${height}px` : '';
        });
    }

    // Ordenação e Inserção
    const sortedTasks = [...tasks].sort((a, b) => {
        const dayA = dayMap[a.day] ?? 0;
        const dayB = dayMap[b.day] ?? 0;
        if (dayA !== dayB) return dayA - dayB;
        return a.startTime.localeCompare(b.startTime);
    });

    sortedTasks.forEach(task => {
        const dayIndex = dayMap[task.day];
        if (dayIndex === undefined) return;

        const [startH, startM] = task.startTime.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        let endMinutes = task.endTime ? (parseInt(task.endTime.split(':')[0], 10) * 60 + parseInt(task.endTime.split(':')[1], 10)) : startMinutes + 60;

        for (let h = 0; h < 24; h++) {
            const hourStart = h * 60;
            const hourEnd = (h + 1) * 60;

            if (startMinutes < hourEnd && endMinutes > hourStart) {
                const hourDiv = document.querySelector(`#day${dayIndex} .schedule__cell[data-hour="${h}"]`);
                if (!hourDiv) continue;

                const card = document.createElement('article');
                card.className = 'protocol-card';
                card.innerHTML = `
                    <div class="protocol-card__header">
                        <h4 class="protocol-card__title">${task.task}</h4>
                        <button class="btn btn--danger-mini delete-btn" data-id="${task.id}">X</button>
                    </div>
                    <span class="protocol-card__tag tag--${task.tag}">${task.tag}</span>
                    <div class="protocol-card__footer">
                        <span class="protocol-card__time">${task.startTime} ${task.endTime ? '~ ' + task.endTime : ''}</span>
                    </div>
                `;

                card.querySelector('.delete-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteTask(task.id);
                });

                hourDiv.appendChild(card);
            }
        }
    });

    // Ajusta visualização para células com 1 tarefa em espaços expandidos
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        for (let h = 0; h < 24; h++) {
            const cell = document.querySelector(`#day${dayIndex} .schedule__cell[data-hour="${h}"]`);
            if (!cell) continue;
            const tasksInCell = cell.querySelectorAll('.protocol-card');
            if (tasksInCell.length === 1 && parseFloat(cell.style.height) > 70) {
                tasksInCell[0].style.height = '100%';
            }
        }
    }
};

const fullRender = () => {
    renderWeek();
    populateTasks();
};

const addTask = (taskData) => {
    const tasks = loadTasks();
    tasks.push({ id: Date.now().toString(), ...taskData });
    saveTasks(tasks);
    fullRender();
};

const deleteTask = (taskId) => {
    const tasks = loadTasks().filter(t => t.id !== taskId);
    saveTasks(tasks);
    fullRender();
};

// =========================================
// FORM LOGIC (Modal)
// =========================================
const initForm = () => {
    const btnToggle = document.getElementById('btn-toggle-task-form');
    const modal = document.getElementById('modal-task');
    const form = document.getElementById('task-form');
    const btnClose = document.getElementById('btn-close-modal');

    const openModal = () => modal.classList.remove('modal--hidden');
    const closeModal = () => modal.classList.add('modal--hidden');

    btnToggle.addEventListener('click', openModal);
    btnClose.addEventListener('click', closeModal);
    modal.addEventListener('mousedown', (e) => {
        if (e.target === modal) closeModal();
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const task = document.getElementById('task').value.trim();
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        const tag = document.getElementById('tag').value;
        const day = document.getElementById('day').value;

        if (endTime && endTime <= startTime) {
            return alert('End Time must be after Start Time.');
        }

        addTask({ task, startTime, endTime, tag, day });

        closeModal();
        form.reset();
    });
};

// =========================================
// INIT
// =========================================
document.addEventListener('DOMContentLoaded', () => {
    fullRender();
    initForm();
});