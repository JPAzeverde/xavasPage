// ============================================================
// PROTOCOL DIRECTIVE: FIREBASE MATRIX LOGIC
// ============================================================
import { db, collection, addDoc, deleteDoc, doc, onSnapshot } from '../core/firebase-config.js';

let protocolTasks = [];
const DAY_MAP = { monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6 };
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// --- RENDERIZAÇÃO DA GRADE ---
const renderMatrixGrid = () => {
    const grid = document.getElementById('schedule-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const timeCol = document.createElement('div');
    timeCol.className = 'matrix-col matrix-col--time';
    timeCol.innerHTML = `<div class="matrix-header txt-micro">T-XX</div>`;
    
    for (let h = 0; h < 24; h++) {
        const cell = document.createElement('div');
        cell.className = 'matrix-cell';
        cell.dataset.hour = h;
        cell.innerHTML = `<span class="matrix-hour-label">${String(h).padStart(2, '0')}:00</span>`;
        timeCol.appendChild(cell);
    }
    grid.appendChild(timeCol);

    DAY_NAMES.forEach((dayName, index) => {
        const dayCol = document.createElement('div');
        dayCol.className = 'matrix-col';
        dayCol.id = `day${index}`;
        dayCol.innerHTML = `<div class="matrix-header txt-micro">${dayName}</div>`;

        for (let h = 0; h < 24; h++) {
            const cell = document.createElement('div');
            cell.className = 'matrix-cell';
            cell.dataset.hour = h;
            dayCol.appendChild(cell);
        }
        grid.appendChild(dayCol);
    });
};

const injectDirectives = () => {
    renderMatrixGrid(); // Limpa e recria a grade antes de injetar
    const taskCount = Array.from({ length: 7 }, () => Array(24).fill(0));

    protocolTasks.forEach(task => {
        const dayIndex = DAY_MAP[task.day];
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
            if (taskCount[d][h] > maxTasksPerHour[h]) maxTasksPerHour[h] = taskCount[d][h];
        }
    }

    for (let h = 0; h < 24; h++) {
        const height = maxTasksPerHour[h] > 0 ? maxTasksPerHour[h] * 55 : 0;
        document.querySelectorAll(`.matrix-cell[data-hour="${h}"]`).forEach(cell => {
            cell.style.height = height > 0 ? `${height}px` : '';
        });
    }

    const sortedTasks = [...protocolTasks].sort((a, b) => {
        const dayA = DAY_MAP[a.day] ?? 0;
        const dayB = DAY_MAP[b.day] ?? 0;
        if (dayA !== dayB) return dayA - dayB;
        return a.startTime.localeCompare(b.startTime);
    });

    sortedTasks.forEach(task => {
        const dayIndex = DAY_MAP[task.day];
        if (dayIndex === undefined) return;

        const [startH, startM] = task.startTime.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        let endMinutes = task.endTime ? (parseInt(task.endTime.split(':')[0], 10) * 60 + parseInt(task.endTime.split(':')[1], 10)) : startMinutes + 60;

        for (let h = 0; h < 24; h++) {
            const hourStart = h * 60;
            const hourEnd = (h + 1) * 60;

            if (startMinutes < hourEnd && endMinutes > hourStart) {
                const hourDiv = document.querySelector(`#day${dayIndex} .matrix-cell[data-hour="${h}"]`);
                if (!hourDiv) continue;

                const card = document.createElement('article');
                card.className = 'timeline-node';
                card.innerHTML = `
                    <div class="timeline-node__header">
                        <span class="timeline-node__tag">[${task.tag}]</span>
                        <button class="btn--danger-mini delete-btn" data-id="${task.id}" style="background:transparent; border:none; color:var(--accent-alert); cursor:pointer; font-size:0.6rem;">X</button>
                    </div>
                    <h4 class="timeline-node__title">${task.task}</h4>
                    <span class="txt-micro" style="font-size: 0.6rem;">${task.startTime} ${task.endTime ? '~ ' + task.endTime : ''}</span>
                `;

                card.querySelector('.delete-btn').addEventListener('click', async (e) => {
                    e.stopPropagation();
                    try {
                        await deleteDoc(doc(db, "protocol_tasks", task.id));
                    } catch(err) { console.error("SYS.ERR: Deletion failed.", err); }
                });

                hourDiv.appendChild(card);
            }
        }
    });
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
});