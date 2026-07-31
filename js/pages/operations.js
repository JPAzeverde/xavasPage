// ============================================================
// TACTICAL OPERATIONS: FIREBASE KANBAN LOGIC
// ============================================================
import { db, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from '../core/firebase-config.js';

let tasks = [];
let currentEditId = null;

const TAG_MAP = {
    'unilavras': { label: 'UNILAVRAS', class: 'tag--unilavras' },
    'solargun': { label: 'SOLARGUN', class: 'tag--solargun' },
    'pessoal': { label: 'PERSONAL', class: 'tag--pessoal' }
};

const DOM = {
    columns: document.querySelectorAll('.kanban-col'),
    contents: {
        'todo': document.getElementById('col-todo'),
        'in-progress': document.getElementById('col-in-progress'),
        'done': document.getElementById('col-done'),
        'dropped': document.getElementById('col-dropped')
    },
    modal: document.getElementById('modal-task'),
    inputs: {
        title: document.getElementById('modal-title'),
        status: document.getElementById('modal-status'),
        tag: document.getElementById('modal-tag'),
        deadline: document.getElementById('modal-deadline'),
        details: document.getElementById('modal-details')
    },
    buttons: {
        save: document.getElementById('btn-save-task'),
        del: document.getElementById('btn-delete-task'),
        add: document.getElementById('btn-add-task'),
        close: document.getElementById('btn-close-modal')
    }
};

const formatDeadline = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `T-0: ${day}/${month}/${year}`;
};

// --- RENDERIZAÇÃO ---
const syncKanban = () => {
    Object.keys(DOM.contents).forEach(key => {
        DOM.contents[key].innerHTML = '';
        document.getElementById(`count-${key}`).textContent = '0';
    });

    const sortedTasks = [...tasks].sort((a, b) => {
        if (!a.deadline && b.deadline) return 1;
        if (a.deadline && !b.deadline) return -1;
        if (!a.deadline && !b.deadline) return 0;
        return new Date(a.deadline) - new Date(b.deadline);
    });

    sortedTasks.forEach(task => {
        const card = document.createElement('article');
        card.className = 'kanban-card';
        card.draggable = true;
        card.dataset.id = task.id;

        const tagHtml = (task.tag && TAG_MAP[task.tag]) 
            ? `<span class="kanban-card__tag ${TAG_MAP[task.tag].class}">${TAG_MAP[task.tag].label}</span>` : '';
        const dateHtml = task.deadline ? `<span class="kanban-card__date">${formatDeadline(task.deadline)}</span>` : '';

        card.innerHTML = `${tagHtml}<h4 class="kanban-card__title">${task.title}</h4>${dateHtml}`;

        card.addEventListener('dragstart', (e) => {
            card.classList.add('is-dragging');
            e.dataTransfer.setData('text/plain', task.id);
        });
        card.addEventListener('dragend', () => card.classList.remove('is-dragging'));
        card.addEventListener('click', () => openEditor(task.id));

        if (DOM.contents[task.status]) DOM.contents[task.status].appendChild(card);
    });

    Object.keys(DOM.contents).forEach(key => {
        document.getElementById(`count-${key}`).textContent = tasks.filter(t => t.status === key).length;
    });
};

// --- DRAG AND DROP (FIREBASE) ---
DOM.columns.forEach(col => {
    col.addEventListener('dragover', (e) => { e.preventDefault(); col.classList.add('is-dragover'); });
    col.addEventListener('dragleave', () => col.classList.remove('is-dragover'));
    col.addEventListener('drop', async (e) => {
        e.preventDefault();
        col.classList.remove('is-dragover');
        
        const taskId = e.dataTransfer.getData('text/plain');
        const newStatus = col.dataset.status;
        
        if (taskId && newStatus) {
            const task = tasks.find(t => t.id === taskId);
            if (task && task.status !== newStatus) {
                try {
                    await updateDoc(doc(db, "operations_tasks", taskId), { status: newStatus });
                } catch (error) { console.error("SYS.ERR: Drag sync failed.", error); }
            }
        }
    });
});

// --- EDITOR DE DADOS ---
const openEditor = (id = null) => {
    currentEditId = id;
    if (id) {
        const task = tasks.find(t => t.id === id);
        DOM.inputs.title.value = task.title;
        DOM.inputs.status.value = task.status;
        DOM.inputs.tag.value = task.tag || '';
        DOM.inputs.deadline.value = task.deadline || '';
        DOM.inputs.details.value = task.details || '';
        DOM.buttons.del.style.display = 'block';
    } else {
        DOM.inputs.title.value = '';
        DOM.inputs.status.value = 'todo';
        DOM.inputs.tag.value = '';
        DOM.inputs.deadline.value = '';
        DOM.inputs.details.value = '';
        DOM.buttons.del.style.display = 'none';
    }
    DOM.modal.classList.remove('modal--hidden');
};

const closeEditor = () => {
    DOM.modal.classList.add('modal--hidden');
    currentEditId = null;
};

DOM.buttons.add.addEventListener('click', () => openEditor());
DOM.buttons.close.addEventListener('click', closeEditor);
DOM.modal.addEventListener('mousedown', (e) => { if (e.target === DOM.modal) closeEditor(); });

DOM.buttons.save.addEventListener('click', async () => {
    const payload = {
        title: DOM.inputs.title.value.trim() || 'UNNAMED_OBJECTIVE',
        status: DOM.inputs.status.value,
        tag: DOM.inputs.tag.value,
        deadline: DOM.inputs.deadline.value,
        details: DOM.inputs.details.value
    };

    try {
        if (currentEditId) {
            await updateDoc(doc(db, "operations_tasks", currentEditId), payload);
        } else {
            await addDoc(collection(db, "operations_tasks"), payload);
        }
        closeEditor();
    } catch (error) { console.error("SYS.ERR: Commit failed.", error); }
});

DOM.buttons.del.addEventListener('click', async () => {
    if (confirm("SYS.WARN: Permanently scrub this objective from the database?")) {
        try {
            await deleteDoc(doc(db, "operations_tasks", currentEditId));
            closeEditor();
        } catch (error) { console.error("SYS.ERR: Scrub failed.", error); }
    }
});

// --- LISTENER EM TEMPO REAL ---
document.addEventListener('DOMContentLoaded', () => {
    onSnapshot(collection(db, "operations_tasks"), (snapshot) => {
        tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        syncKanban();
    });
});