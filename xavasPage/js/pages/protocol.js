// ============================================================
// PROTOCOL DIRECTIVE: FIREBASE MATRIX LOGIC
// ============================================================
import { db, collection, addDoc, deleteDoc, doc, onSnapshot } from '../core/firebase-config.js';

let protocolTasks = [];
const DAY_MAP = { monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6 };
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// --- RENDERIZAÇÃO DA GRADE BASE ---
const renderMatrixGrid = () => {
    const grid = document.getElementById('schedule-grid');
    if (!grid) return;
    grid.innerHTML = '';

    // Coluna das horas (T-XX)
    const timeCol = document.createElement('div');
    timeCol.className = 'matrix-col matrix-col--time';
    timeCol.innerHTML = `<div class="matrix-header txt-micro">HOUR</div>`;
    
    const timeWrapper = document.createElement('div');
    timeWrapper.className = 'timeline-bg-wrapper'; 
    for (let h = 0; h < 24; h++) {
        const cell = document.createElement('div');
        cell.className = 'matrix-cell';
        cell.innerHTML = `<span class="matrix-hour-label">${String(h).padStart(2, '0')}:00</span>`;
        timeWrapper.appendChild(cell);
    }
    timeCol.appendChild(timeWrapper);
    grid.appendChild(timeCol);

    // Colunas dos dias da semana
    DAY_NAMES.forEach((dayName, index) => {
        const dayCol = document.createElement('div');
        dayCol.className = 'matrix-col';
        dayCol.id = `day${index}`;
        dayCol.innerHTML = `<div class="matrix-header txt-micro">${dayName}</div>`;

        const timelineWrapper = document.createElement('div');
        timelineWrapper.className = 'timeline-wrapper';
        timelineWrapper.style.position = 'relative';

        for (let h = 0; h < 24; h++) {
            const cell = document.createElement('div');
            cell.className = 'matrix-cell';
            timelineWrapper.appendChild(cell);
        }
        dayCol.appendChild(timelineWrapper);
        grid.appendChild(dayCol);
    });
};

// --- INDICADOR DO TEMPO ATUAL (Com altura dinâmica) ---
const highlightToday = () => {
    const now = new Date();
    const todayIndex = (now.getDay() + 6) % 7; // Ajuste para segunda = 0
    const dayCol = document.getElementById(`day${todayIndex}`);
    if (dayCol) {
        dayCol.classList.add('today-column');
    }

    // Limpa os indicadores antigos
    document.querySelectorAll('.current-time-indicator').forEach(el => el.remove());

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    const timelineWrapper = document.querySelector(`#day${todayIndex} .timeline-wrapper`);
    if (timelineWrapper) {
        const cells = timelineWrapper.querySelectorAll('.matrix-cell');
        let topPosition = 0;

        // Soma a altura real (em pixels) de todas as horas anteriores
        for (let i = 0; i < currentHour; i++) {
            if (cells[i]) topPosition += cells[i].offsetHeight;
        }
        
        // Adiciona a fração dos minutos baseada na altura dinâmica da hora atual
        if (cells[currentHour]) {
            topPosition += (currentMinute / 60) * cells[currentHour].offsetHeight;
        }
        
        const indicator = document.createElement('div');
        indicator.className = 'current-time-indicator';
        indicator.style.position = 'absolute';
        indicator.style.top = `${topPosition}px`;
        indicator.style.left = '0';
        indicator.style.width = '100%';
        indicator.style.zIndex = '999';
        indicator.innerHTML = '<div style="width: 95%; height: 1px; background: red; position: absolute; top: -1px; left:5px"></div>';
        timelineWrapper.appendChild(indicator);
    }
};

// --- INJEÇÃO DE DIRETRIZES (Empilhamento Vertical) ---
const injectDirectives = () => {
    renderMatrixGrid(); 

    const BASE_CELL_HEIGHT = 40;     // Altura inicial sem tarefas
    const MULTIPLIER_PER_TASK = 70;  // Pixels adicionados POR TAREFA extra
    const MIN_CARD_HEIGHT = 38;      // Altura visual mínima para os cards

    // 1. Contar quantas tarefas existem em cada hora de cada dia
    const tasksCountPerDayHour = Array.from({ length: 7 }, () => Array(24).fill(0));

    protocolTasks.forEach(task => {
        const dayIndex = DAY_MAP[task.day];
        if (dayIndex === undefined) return;

        const [startH] = task.startTime.split(':').map(Number);
        let endH = startH;
        
        if (task.endTime) {
            const [eH, eM] = task.endTime.split(':').map(Number);
            endH = eH;
            if (eM === 0 && eH > startH) endH--;
        }

        for (let h = startH; h <= Math.min(endH, 23); h++) {
            tasksCountPerDayHour[dayIndex][h]++;
        }
    });

    // 2. Definir a altura global de cada hora 
    const globalHourHeights = Array(24).fill(BASE_CELL_HEIGHT);
    for (let h = 0; h < 24; h++) {
        let maxTasksInThisHour = 0;
        for (let d = 0; d < 7; d++) {
            if (tasksCountPerDayHour[d][h] > maxTasksInThisHour) {
                maxTasksInThisHour = tasksCountPerDayHour[d][h];
            }
        }
        if (maxTasksInThisHour > 0) {
            globalHourHeights[h] = BASE_CELL_HEIGHT + (maxTasksInThisHour * MULTIPLIER_PER_TASK);
        }
    }

    // 3. Aplicar as alturas diretamente no DOM
    for (let h = 0; h < 24; h++) {
        const timeCell = document.querySelector('.matrix-col--time .timeline-bg-wrapper')?.children[h];
        if (timeCell) timeCell.style.height = `${globalHourHeights[h]}px`;

        for (let d = 0; d < 7; d++) {
            const dayCell = document.querySelector(`#day${d} .timeline-wrapper`)?.children[h];
            if (dayCell) dayCell.style.height = `${globalHourHeights[h]}px`;
        }
    }

    const getMinuteY = (minutes) => {
        const targetHour = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        let currentTop = 0;

        for (let h = 0; h < targetHour; h++) {
            currentTop += globalHourHeights[h];
        }
        if (targetHour < 24) {
            currentTop += (remainingMinutes / 60) * globalHourHeights[targetHour];
        }
        return { top: currentTop };
    };

    // 4. Preparar tarefas
    const tasksByDay = {};
    protocolTasks.forEach(task => {
        const dayIndex = DAY_MAP[task.day];
        if (dayIndex !== undefined) {
            if (!tasksByDay[dayIndex]) tasksByDay[dayIndex] = [];
            tasksByDay[dayIndex].push(task);
        }
    });

    Object.entries(tasksByDay).forEach(([dayIndex, tasks]) => {
        const timelineWrapper = document.querySelector(`#day${dayIndex} .timeline-wrapper`);
        if (!timelineWrapper) return;

        // Ordem cronológica
        tasks.sort((a, b) => {
            const [aH, aM] = a.startTime.split(':').map(Number);
            const [bH, bM] = b.startTime.split(':').map(Number);
            return (aH * 60 + aM) - (bH * 60 + bM);
        });

        const taskInfos = tasks.map(task => {
            const [startH, startM] = task.startTime.split(':').map(Number);
            const startMinutes = startH * 60 + startM;
            let endMinutes;
            let isPunctual = false;

            if (task.endTime) {
                const [endH, endM] = task.endTime.split(':').map(Number);
                endMinutes = endH * 60 + endM;
                if (endMinutes <= startMinutes) endMinutes = startMinutes + 5;
            } else {
                isPunctual = true;
                endMinutes = startMinutes + 5;
            }

            const startPos = getMinuteY(startMinutes);
            const endPos = getMinuteY(endMinutes);

            let calculatedHeight = endPos.top - startPos.top;
            const visualHeight = Math.max(calculatedHeight, MIN_CARD_HEIGHT);

            // ADICIONADO: endPosTop para sabermos onde a tarefa realmente deve terminar
            return { task, startMinutes, topPosition: startPos.top, endPosTop: endPos.top, visualHeight, isPunctual };
        });

        // 5. EMPILHAMENTO VERTICAL (Substitui os antigos "Clusters")
        let currentBottom = 0; // Armazena onde a última tarefa terminou
        const gap = 4; // Espaço em pixels entre uma tarefa e outra

        taskInfos.forEach((info, index) => {
            const { task, isPunctual, endPosTop } = info;
            let topPosition = info.topPosition;
            let visualHeight = info.visualHeight;

            // Se a posição atual sobrepor a tarefa de cima, empurramos essa tarefa para baixo
           if (topPosition < currentBottom) {
                topPosition = currentBottom + gap;
                
                // NOVO: Recalculamos a altura da tarefa para tentar respeitar a linha de término
                // original, impedindo que ela vaze para a próxima hora visualmente.
                let newCalculatedHeight = endPosTop - topPosition;
                visualHeight = Math.max(newCalculatedHeight, MIN_CARD_HEIGHT);
            }

            // Atualiza o fundo para a próxima tarefa
            // Atualiza o fundo para a próxima tarefa
            currentBottom = topPosition + visualHeight;

            const card = document.createElement('article');
            card.className = `timeline-node tag-${task.tag} ${isPunctual ? 'timeline-node--punctual' : ''}`;

            card.style.position = 'absolute';
            card.style.top = `${topPosition}px`;
            card.style.height = `${visualHeight}px`;
            
            card.style.left = `2%`;
            card.style.width = `96%`;
            card.style.zIndex = 10 + index;

            const isCompact = visualHeight <= 45;
            let html = '';

            if (isCompact) {
                html = `
                    <div class="timeline-node__header" style="margin-bottom: 0; align-items: center; gap: 4px; height: 100%;">
                        
                        <span class="timeline-node__title">${task.task}</span>
                        
                        
                        <button class="btn--danger-protocol delete-btn" data-id="${task.id}" style="line-height: 1;">✕</button>
                    </div>
                    <span class="timeline-node__time" style="font-size: 0.55rem; font-weight: bold; line-height: 1; padding-right:8px">
                        ${task.startTime} ${task.endTime ? `→ ${task.endTime}` : ''}
                    </span>
                `;
            } else {
                html = `
                    <div class="timeline-node__header">
                        <div style="display: flex; gap: 4px; align-items: baseline;">
                            <span class="timeline-node__title">${task.task}</span>
                            
                        </div>
                        <button class="btn--danger-protocol delete-btn" data-id="${task.id}">✕</button>
                    </div>
                    <span class="timeline-node__time" style="font-size: 0.55rem;">${task.startTime} ${task.endTime ? `→ ${task.endTime}` : ''}</span>
                    
                `;
            }

            card.innerHTML = html;

            card.querySelector('.delete-btn')?.addEventListener('click', async (e) => {
                e.stopPropagation();
                try {
                    await deleteDoc(doc(db, "protocol_tasks", task.id));
                } catch(err) { console.error("SYS.ERR: Deletion failed.", err); }
            });

            timelineWrapper.appendChild(card);
        });
    });

    const dateDisplay = document.getElementById('current-date-display');
    if (dateDisplay) {
        const now = new Date();
        dateDisplay.textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
    
    highlightToday();
};

// --- INTERFACE DO MODAL ---
const initInterface = () => {
    const btnToggle = document.getElementById('btn-toggle-task-form');
    const modal = document.getElementById('modal-task');
    const form = document.getElementById('task-form');
    const btnClose = document.getElementById('btn-close-modal');

    const openModal = () => modal.classList.remove('modal--hidden');
    const closeModal = () => modal.classList.add('modal--hidden');

    btnToggle.addEventListener('click', openModal);
    btnClose.addEventListener('click', closeModal);
    modal.addEventListener('mousedown', (e) => { if (e.target === modal) closeModal(); });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            task: document.getElementById('task').value.trim(),
            startTime: document.getElementById('startTime').value,
            endTime: document.getElementById('endTime').value,
            tag: document.getElementById('tag').value,
            day: document.getElementById('day').value
        };

        if (payload.endTime && payload.endTime <= payload.startTime) {
            return alert('SYS.ERR: Time parameter invalid (End <= Start).');
        }

        try {
            await addDoc(collection(db, "protocol_tasks"), payload);
            closeModal();
            form.reset();
        } catch (error) { console.error("SYS.ERR: Deployment failed.", error); }
    });
};

document.addEventListener('DOMContentLoaded', () => {
    renderMatrixGrid();
    initInterface();
    
    // Conexão em tempo real
    onSnapshot(collection(db, "protocol_tasks"), (snapshot) => {
        protocolTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        injectDirectives();
    });

    // Atualizar indicador de hora a cada minuto
    setInterval(() => {
        highlightToday();
    }, 60000);
});