// protocol.js

// ============================================================
// 1. MAPEAMENTOS E CONSTANTES
// ============================================================

const dayMap = {
    monday: 0,
    tuesday: 1,
    wednesday: 2,
    thursday: 3, // mantido o typo do HTML
    friday: 4,
    saturday: 5,
    sunday: 6
};

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const STORAGE_KEY = 'protocol_tasks';

// ============================================================
// 2. LOCAL STORAGE
// ============================================================

function loadTasks() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveTasks(tasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// ============================================================
// 3. CARREGAMENTO INICIAL VIA JSON (SE LOCALSTORAGE VAZIO)
// ============================================================

async function loadInitialData() {
    // Só carrega do JSON se não houver nada salvo ainda
    if (loadTasks().length > 0) return;

    try {
        const response = await fetch('../assets/json/protocol.json');
        if (!response.ok) throw new Error('JSON não encontrado');
        const jsonTasks = await response.json();
        if (Array.isArray(jsonTasks) && jsonTasks.length > 0) {
            saveTasks(jsonTasks);
        }
    } catch (error) {
        console.log('Nenhum JSON inicial carregado, usando localStorage vazio.');
    }
}

// ============================================================
// 4. RENDERIZAÇÃO DA SEMANA VIA JS
// ============================================================

function renderWeek() {
    const weekContainer = document.querySelector('#section-week-procotol .week');
    if (!weekContainer) return;
    weekContainer.innerHTML = '';

    // Coluna de horas (hour-colum)
    const hourColum = document.createElement('div');
    hourColum.className = 'hour-colum';
    const headerHours = document.createElement('h3');
    headerHours.className = 'day-title';
    headerHours.textContent = '-';
    hourColum.appendChild(headerHours);

    for (let h = 0; h < 24; h++) {
        const hourDiv = document.createElement('div');
        hourDiv.className = 'hour';
        hourDiv.setAttribute('data-hour', h);
        const p = document.createElement('p');
        p.className = 'hour-txt';
        p.textContent = `${String(h).padStart(2, '0')}:00`;
        hourDiv.appendChild(p);
        hourColum.appendChild(hourDiv);
    }
    weekContainer.appendChild(hourColum);

    // Colunas dos 7 dias
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'day';
        dayDiv.id = `day${dayIndex}`;

        const dayTitle = document.createElement('h3');
        dayTitle.className = 'day-title';
        dayTitle.textContent = dayNames[dayIndex];
        dayDiv.appendChild(dayTitle);

        for (let h = 0; h < 24; h++) {
            const hourDiv = document.createElement('div');
            hourDiv.className = 'hour';
            hourDiv.setAttribute('data-hour', h);
            dayDiv.appendChild(hourDiv);
        }
        weekContainer.appendChild(dayDiv);
    }
}

// ============================================================
// 5. INSERÇÃO DAS TAREFAS COM ALTURA UNIFORME POR HORA
// ============================================================

function populateTasks() {
    const tasks = loadTasks();

    // Conta tarefas por dia/hora
    const taskCount = Array.from({ length: 7 }, () => Array(24).fill(0));

    tasks.forEach(task => {
        const dayIndex = dayMap[task.day];
        if (dayIndex === undefined) return;

        const startHour = parseInt(task.startTime.split(':')[0], 10);
        const endHour = task.endTime
            ? parseInt(task.endTime.split(':')[0], 10)
            : startHour + 1;

        for (let h = startHour; h < endHour; h++) {
            if (h >= 0 && h < 24) {
                taskCount[dayIndex][h]++;
            }
        }
    });

    // Altura máxima por hora (todos os dias)
    const maxTasksPerHour = Array(24).fill(0);
    for (let h = 0; h < 24; h++) {
        for (let d = 0; d < 7; d++) {
            if (taskCount[d][h] > maxTasksPerHour[h]) {
                maxTasksPerHour[h] = taskCount[d][h];
            }
        }
    }

    // Aplica altura a todas as células com data-hour (inclusive coluna de horas)
    for (let h = 0; h < 24; h++) {
        const height = maxTasksPerHour[h] > 0 ? maxTasksPerHour[h] * 75 : 0;
        const cells = document.querySelectorAll(`.hour[data-hour="${h}"]`);
        cells.forEach(cell => {
            cell.style.height = height > 0 ? `${height}px` : '';
        });
    }

    // Ordena tarefas
    const sortedTasks = [...tasks].sort((a, b) => {
        const dayA = dayMap[a.day] ?? 0;
        const dayB = dayMap[b.day] ?? 0;
        if (dayA !== dayB) return dayA - dayB;
        return a.startTime.localeCompare(b.startTime);
    });

    // Insere cards
    sortedTasks.forEach(task => {
        const dayIndex = dayMap[task.day];
        if (dayIndex === undefined) return;

        // Converte horários para minutos
        const [startH, startM] = task.startTime.split(':').map(Number);
        const startMinutes = startH * 60 + startM;

        let endMinutes;
        if (task.endTime) {
            const [endH, endM] = task.endTime.split(':').map(Number);
            endMinutes = endH * 60 + endM;
        } else {
            endMinutes = startMinutes + 60; // duração padrão de 1h se não informado
        }

        // Para cada hora, verifica se a tarefa se sobrepõe a ela
        for (let h = 0; h < 24; h++) {
            const hourStart = h * 60;
            const hourEnd = (h + 1) * 60;

            // Se há interseção entre [startMinutes, endMinutes) e [hourStart, hourEnd)
            if (startMinutes < hourEnd && endMinutes > hourStart) {
                const hourDiv = document.querySelector(`#day${dayIndex} [data-hour="${h}"]`);
                if (!hourDiv) continue;

                const taskDiv = document.createElement('div');
                taskDiv.className = 'task';
                taskDiv.setAttribute('data-task-id', task.id);

                // Header
                const headerDiv = document.createElement('div');
                headerDiv.className = 'header-task';
                const titleP = document.createElement('p');
                titleP.className = 'title-task';
                titleP.textContent = task.task;
                const closeBtn = document.createElement('button');
                closeBtn.className = 'btn-danger-mini';
                closeBtn.textContent = 'X';
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteTask(task.id);
                });
                headerDiv.appendChild(titleP);
                headerDiv.appendChild(closeBtn);

                // Tag
                const tagP = document.createElement('p');
                tagP.className = `tag ${task.tag}`;
                tagP.textContent = task.tag.charAt(0).toUpperCase() + task.tag.slice(1);

                // Horários
                const bottomDiv = document.createElement('div');
                bottomDiv.className = 'bottom-task';
                const startP = document.createElement('p');
                startP.className = 'start-time';
                startP.textContent = task.startTime;
                const midP = document.createElement('p');
                midP.className = 'mid-time';
                midP.textContent = task.endTime ? '~' : '';
                const endP = document.createElement('p');
                endP.className = 'end-time';
                endP.textContent = task.endTime || '';

                bottomDiv.appendChild(startP);
                bottomDiv.appendChild(midP);
                bottomDiv.appendChild(endP);

                taskDiv.appendChild(headerDiv);
                taskDiv.appendChild(tagP);
                taskDiv.appendChild(bottomDiv);

                hourDiv.appendChild(taskDiv);
            }
        }
    });
    // Ajusta tarefas solitárias para ocupar 100% da altura da célula
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        for (let h = 0; h < 24; h++) {
            const cell = document.querySelector(`#day${dayIndex} [data-hour="${h}"]`);
            if (!cell) continue;
            const tasksInCell = cell.querySelectorAll('.task');
            if (tasksInCell.length === 1) {
                const cellHeight = parseFloat(cell.style.height);
                if (cellHeight > 75) { // só se a célula foi aumentada
                    tasksInCell[0].style.height = '100%';
                }
            }
        }
    }
}

function fullRender() {
    renderWeek();
    populateTasks();
}

// ============================================================
// 6. CRUD DE TAREFAS
// ============================================================

function addTask(taskData) {
    const tasks = loadTasks();
    const newTask = {
        id: Date.now().toString(),
        ...taskData
    };
    tasks.push(newTask);
    saveTasks(tasks);
    fullRender();
}

function deleteTask(taskId) {
    let tasks = loadTasks();
    tasks = tasks.filter(t => t.id !== taskId);
    saveTasks(tasks);
    fullRender();
}

// ============================================================
// 7. FORMULÁRIO COM TRANSIÇÃO SUAVE
// ============================================================

function initForm() {
    const addTaskBtn = document.getElementById('btn-01-addTask');
    const formSection = document.getElementById('form-task-section');
    const form = document.getElementById('taskForm');
    let isFormVisible = false;

    addTaskBtn.addEventListener('click', () => {
        isFormVisible = !isFormVisible;
        if (isFormVisible) {
            formSection.style.maxHeight = '500px';
            formSection.style.opacity = '1';
            formSection.style.paddingTop = '';
            formSection.style.paddingBottom = '';
        } else {
            formSection.style.maxHeight = '0px';
            formSection.style.opacity = '0';
            formSection.style.paddingTop = '0px';
            formSection.style.paddingBottom = '0px';
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const task = document.getElementById('task').value.trim();
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        const tag = document.getElementById('tag').value;
        const day = document.getElementById('day').value;

        if (!task || !startTime || !tag || !day) {
            alert('Preencha todos os campos obrigatórios (Task, StartTime, Tag, Day).');
            return;
        }
        if (endTime && endTime <= startTime) {
            alert('EndTime deve ser posterior ao StartTime.');
            return;
        }

        addTask({ task, startTime, endTime, tag, day });

        // Fecha o formulário suavemente
        formSection.style.maxHeight = '0px';
        formSection.style.opacity = '0';
        formSection.style.paddingTop = '0px';
        formSection.style.paddingBottom = '0px';
        isFormVisible = false;

        form.reset();
    });
}

// ============================================================
// 8. INICIALIZAÇÃO GERAL
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
    const formSection = document.getElementById('form-task-section');

    // Configura transição inicial (oculto)
    formSection.style.overflow = 'hidden';
    formSection.style.maxHeight = '0px';
    formSection.style.opacity = '0';
    formSection.style.transition = 'max-height 0.4s ease, opacity 0.3s ease, padding 0.3s ease';
    formSection.style.paddingTop = '0px';
    formSection.style.paddingBottom = '0px';

    // Carrega dados do JSON se necessário (assíncrono)
    await loadInitialData();

    fullRender();
    initForm();
});