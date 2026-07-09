// =========================================
// HEADER LOGIC (Global Dashboard)
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
// KANBAN LOGIC
// =========================================
let tasks = JSON.parse(localStorage.getItem('operations_tasks')) || [
    { id: 1, title: 'Build automation app', status: 'todo', tag: 'pessoal', deadline: '2026-08-01', details: 'Focus on Python and Selenium.' },
    { id: 2, title: 'Gym tracker app', status: 'in-progress', tag: 'pessoal', deadline: '', details: 'React Native modules.' },
    { id: 3, title: 'Update internal system', status: 'todo', tag: 'solargun', deadline: '', details: 'Check error logs.' },
    { id: 4, title: 'Final Thesis', status: 'todo', tag: 'unilavras', deadline: '', details: 'ABNT formatting.' }
];

let currentEditId = null;

const tagMap = {
    'unilavras': { label: 'Unilavras', class: 'tag--unilavras' },
    'solargun': { label: 'SolarGun', class: 'tag--solargun' },
    'pessoal': { label: 'Personal', class: 'tag--pessoal' }
};

const DOM = {
    columns: document.querySelectorAll('.kanban__col'),
    contents: {
        'todo': document.getElementById('col-todo'),
        'in-progress': document.getElementById('col-in-progress'),
        'done': document.getElementById('col-done'),
        'dropped': document.getElementById('col-dropped')
    },
    modal: document.getElementById('modal-task'),
    mTitle: document.getElementById('modal-title'),
    mStatus: document.getElementById('modal-status'),
    mTag: document.getElementById('modal-tag'),
    mDeadline: document.getElementById('modal-deadline'),
    mDetails: document.getElementById('modal-details'),
    btnSave: document.getElementById('btn-save-task'),
    btnDelete: document.getElementById('btn-delete-task'),
    btnAdd: document.getElementById('btn-add-task'),
    btnClose: document.getElementById('btn-close-modal')
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
};

// Render Interface
const renderBoard = () => {
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
        card.className = 'task-card';
        card.draggable = true;
        card.dataset.id = task.id;

        const tagHtml = (task.tag && tagMap[task.tag]) 
            ? `<span class="task-card__tag ${tagMap[task.tag].class}">${tagMap[task.tag].label}</span>` 
            : '';

        const dateHtml = task.deadline 
            ? `<span class="task-card__date">Due: ${formatDate(task.deadline)}</span>` 
            : '';

        card.innerHTML = `
            <h4 class="task-card__title">${task.title}</h4>
            ${tagHtml}
            ${dateHtml}
        `;

        card.addEventListener('dragstart', (e) => {
            card.classList.add('is-dragging');
            e.dataTransfer.setData('text/plain', task.id);
        });

        card.addEventListener('dragend', () => card.classList.remove('is-dragging'));
        card.addEventListener('click', () => openModal(task.id));

        if (DOM.contents[task.status]) {
            DOM.contents[task.status].appendChild(card);
        }
    });

    Object.keys(DOM.contents).forEach(key => {
        const count = tasks.filter(t => t.status === key).length;
        document.getElementById(`count-${key}`).textContent = count;
    });
};

// Drag and Drop Pipeline
DOM.columns.forEach(col => {
    col.addEventListener('dragover', (e) => {
        e.preventDefault();
        col.classList.add('is-dragover');
    });

    col.addEventListener('dragleave', () => col.classList.remove('is-dragover'));

    col.addEventListener('drop', (e) => {
        e.preventDefault();
        col.classList.remove('is-dragover');
        
        const taskId = e.dataTransfer.getData('text/plain');
        const newStatus = col.dataset.status;
        
        if (taskId && newStatus) {
            const taskIndex = tasks.findIndex(t => t.id.toString() === taskId);
            if (taskIndex > -1 && tasks[taskIndex].status !== newStatus) {
                tasks[taskIndex].status = newStatus;
                saveData();
            }
        }
    });
});

const saveData = () => {
    localStorage.setItem('operations_tasks', JSON.stringify(tasks));
    renderBoard();
};

// Modal Operations
const openModal = (id = null) => {
    currentEditId = id;
    if (id) {
        const task = tasks.find(t => t.id === id);
        DOM.mTitle.value = task.title;
        DOM.mStatus.value = task.status;
        DOM.mTag.value = task.tag || '';
        DOM.mDeadline.value = task.deadline || '';
        DOM.mDetails.value = task.details || '';
        DOM.btnDelete.style.display = 'block';
    } else {
        DOM.mTitle.value = '';
        DOM.mStatus.value = 'todo';
        DOM.mTag.value = '';
        DOM.mDeadline.value = '';
        DOM.mDetails.value = '';
        DOM.btnDelete.style.display = 'none';
    }
    DOM.modal.classList.remove('modal--hidden');
};

const closeModal = () => {
    DOM.modal.classList.add('modal--hidden');
    currentEditId = null;
};

// Listeners
DOM.btnAdd.addEventListener('click', () => openModal());
DOM.btnClose.addEventListener('click', closeModal);
DOM.modal.addEventListener('mousedown', (e) => {
    if (e.target === DOM.modal) closeModal();
});

DOM.btnSave.addEventListener('click', () => {
    const title = DOM.mTitle.value.trim() || 'Untitled Objective';
    const payload = {
        title,
        status: DOM.mStatus.value,
        tag: DOM.mTag.value,
        deadline: DOM.mDeadline.value,
        details: DOM.mDetails.value
    };

    if (currentEditId) {
        const idx = tasks.findIndex(t => t.id === currentEditId);
        tasks[idx] = { ...tasks[idx], ...payload };
    } else {
        tasks.push({ id: Date.now(), ...payload });
    }
    
    saveData();
    closeModal();
});

DOM.btnDelete.addEventListener('click', () => {
    if (confirm("Are you sure you want to delete this objective?")) {
        tasks = tasks.filter(t => t.id !== currentEditId);
        saveData();
        closeModal();
    }
});

document.addEventListener('DOMContentLoaded', renderBoard);