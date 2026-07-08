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
// STATE & STORAGE
// =========================================
let categories = JSON.parse(localStorage.getItem('entertainment_categories')) || [
    
];

let items = JSON.parse(localStorage.getItem('entertainment_items')) || [];

let currentCategory = null; 
let currentEditId = null; 
let tempCategoryFields = []; 

// =========================================
// DOM ELEMENTS
// =========================================
const DOM = {
    views: { hub: document.getElementById('view-categories'), kanban: document.getElementById('view-category-details') },
    ui: { pageTitle: document.getElementById('page-title'), btnBack: document.getElementById('btn-back'), actions: document.getElementById('action-buttons') },
    board: {
        'todo': document.getElementById('col-todo'),
        'in-progress': document.getElementById('col-in-progress'),
        'done': document.getElementById('col-done'),
        'dropped': document.getElementById('col-dropped')
    },
    modals: {
        category: document.getElementById('modal-category'),
        item: document.getElementById('modal-item')
    }
};

// =========================================
// CATEGORY MANAGEMENT
// =========================================
const saveCategories = () => {
    localStorage.setItem('entertainment_categories', JSON.stringify(categories));
    renderCategories();
};

const renderCategories = () => {
    const container = DOM.views.hub;
    // Remove all except the "New Category" button
    Array.from(container.children).forEach(child => {
        if (child.id !== 'btn-new-category') child.remove();
    });

    categories.forEach(cat => {
        const count = items.filter(i => i.categoryId === cat.id).length;
        const card = document.createElement('div');
        card.className = 'card category-card';
        card.innerHTML = `
            <button class="btn btn--danger-mini category-card__del" data-id="${cat.id}">X</button>
            <h3 class="title-md">${cat.name}</h3>
            <p class="text-small">${count} items</p>
        `;

        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('category-card__del')) return;
            openCategory(cat);
        });

        card.querySelector('.category-card__del').addEventListener('click', (e) => {
            e.stopPropagation();
            if(confirm(`Delete category "${cat.name}" and ALL its items?`)) {
                categories = categories.filter(c => c.id !== cat.id);
                items = items.filter(i => i.categoryId !== cat.id);
                saveCategories();
                saveAndRenderItems();
            }
        });

        container.insertBefore(card, document.getElementById('btn-new-category'));
    });
};

// =========================================
// CATEGORY MODAL BUILDER
// =========================================
const inputCatType = document.getElementById('new-field-type');
const inputCatOptions = document.getElementById('new-field-options');
const catFieldsList = document.getElementById('cat-fields-list');

inputCatType.addEventListener('change', (e) => {
    inputCatOptions.style.display = e.target.value === 'select' ? 'block' : 'none';
});

const renderTempFields = () => {
    catFieldsList.innerHTML = '';
    tempCategoryFields.forEach((f, index) => {
        const div = document.createElement('div');
        div.className = 'modal__field-item';
        div.innerHTML = `
            <span class="text-small">${f.label} <small>(${f.type})</small></span>
            <button type="button" class="btn btn--danger-mini" data-index="${index}">Remove</button>
        `;
        div.querySelector('button').addEventListener('click', () => {
            tempCategoryFields.splice(index, 1);
            renderTempFields();
        });
        catFieldsList.appendChild(div);
    });
};

document.getElementById('btn-add-field').addEventListener('click', () => {
    const label = document.getElementById('new-field-label').value.trim();
    const type = inputCatType.value;
    const options = inputCatOptions.value.split(',').map(s => s.trim()).filter(s => s);

    if (!label) return alert("Field name is required.");
    if (type === 'select' && options.length === 0) return alert("Insert comma-separated options.");

    tempCategoryFields.push({ id: 'f_' + Date.now(), label, type, options });
    
    document.getElementById('new-field-label').value = '';
    inputCatOptions.value = '';
    renderTempFields();
});

document.getElementById('form-category').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('cat-name').value.trim();
    categories.push({ id: 'cat_' + Date.now(), name, fields: [...tempCategoryFields] });
    saveCategories();
    DOM.modals.category.classList.add('modal--hidden');
});

document.getElementById('btn-new-category').addEventListener('click', () => {
    document.getElementById('cat-name').value = '';
    tempCategoryFields = [];
    renderTempFields();
    DOM.modals.category.classList.remove('modal--hidden');
});

// =========================================
// VIEW NAVIGATION (Hub -> Kanban)
// =========================================
const openCategory = (categoryObj) => {
    currentCategory = categoryObj;
    DOM.views.hub.style.display = 'none';
    DOM.views.kanban.style.display = 'block';
    DOM.ui.pageTitle.innerText = `Entertainment > ${categoryObj.name}`;
    DOM.ui.btnBack.style.display = 'block';
    DOM.ui.actions.style.display = 'flex';
    renderBoard(); 
};

DOM.ui.btnBack.addEventListener('click', () => {
    currentCategory = null;
    DOM.views.kanban.style.display = 'none';
    DOM.views.hub.style.display = 'grid';
    DOM.ui.pageTitle.innerText = 'Entertainment';
    DOM.ui.btnBack.style.display = 'none';
    DOM.ui.actions.style.display = 'none';
    renderCategories();
});

// =========================================
// KANBAN & ITEMS MANAGEMENT
// =========================================
const saveAndRenderItems = () => {
    localStorage.setItem('entertainment_items', JSON.stringify(items));
    if(currentCategory) renderBoard();
};

const renderBoard = () => {
    Object.keys(DOM.board).forEach(key => {
        DOM.board[key].innerHTML = '';
        document.getElementById(`count-${key}`).textContent = '0';
    });

    const catItems = items.filter(i => i.categoryId === currentCategory.id);

    catItems.forEach(item => {
        const card = document.createElement('article');
        card.className = 'item-card';
        card.draggable = true;
        card.dataset.id = item.id;
        card.innerHTML = `
            <img src="${item.cover}" alt="Cover" class="item-card__cover" draggable="false">
            <h4 class="item-card__title">${item.title}</h4>
        `;
        
        card.addEventListener('dragstart', (e) => {
            card.classList.add('is-dragging');
            e.dataTransfer.setData('text/plain', item.id); 
        });
        card.addEventListener('dragend', () => card.classList.remove('is-dragging'));
        card.addEventListener('click', () => openItemModal(item.id));
        
        if(DOM.board[item.status]) DOM.board[item.status].appendChild(card);
    });

    Object.keys(DOM.board).forEach(key => {
        document.getElementById(`count-${key}`).textContent = catItems.filter(i => i.status === key).length;
    });
};

// Drag and Drop
document.querySelectorAll('.kanban__col').forEach(column => {
    const contentArea = column.querySelector('.kanban__content');
    column.addEventListener('dragover', e => { e.preventDefault(); column.classList.add('is-dragover'); });
    column.addEventListener('dragleave', () => column.classList.remove('is-dragover'));
    column.addEventListener('drop', e => {
        e.preventDefault();
        column.classList.remove('is-dragover');
        const itemId = e.dataTransfer.getData('text/plain');
        const newStatus = column.dataset.status;
        
        if(itemId && newStatus) {
            const itemIndex = items.findIndex(i => i.id.toString() === itemId);
            if(itemIndex > -1 && items[itemIndex].status !== newStatus) {
                items[itemIndex].status = newStatus;
                saveAndRenderItems(); 
            }
        }
    });
});

// =========================================
// ITEM MODAL (DYNAMIC FIELD GENERATOR)
// =========================================
const mItemForm = document.getElementById('form-item');
const dynContainer = document.getElementById('dynamic-fields-container');

const openItemModal = (id = null) => {
    currentEditId = id;
    const item = id ? items.find(i => i.id === id) : {};
    
    document.getElementById('modal-item-title-display').innerText = id ? 'Edit Item' : 'Register Item';
    document.getElementById('modal-item-title').value = item.title || '';
    document.getElementById('modal-item-cover').value = item.cover || '';
    document.getElementById('modal-item-status').value = item.status || 'todo';
    document.getElementById('btn-delete-item').style.display = id ? 'block' : 'none';

    dynContainer.innerHTML = '';
    currentCategory.fields.forEach(f => {
        const val = item.customData ? (item.customData[f.id] ?? '') : '';
        const fieldDiv = document.createElement('div');
        let inputHTML = '';

        if (f.type === 'select') {
            const optionsHTML = f.options.map(opt => `<option value="${opt}" ${val === opt ? 'selected' : ''}>${opt}</option>`).join('');
            inputHTML = `<select id="dyn_${f.id}" class="select-field"><option value="">Select...</option>${optionsHTML}</select>`;
            fieldDiv.innerHTML = `<label class="text-small" style="display:block; margin-bottom:var(--sp-1);">${f.label}</label>${inputHTML}`;
        } else if (f.type === 'checkbox') {
            const isChecked = (val === true || val === 'true') ? 'checked' : '';
            inputHTML = `
                <div style="display: flex; align-items: center; gap: var(--sp-2);">
                    <input type="checkbox" id="dyn_${f.id}" ${isChecked}>
                    <label for="dyn_${f.id}" class="text-small" style="cursor: pointer;">${f.label}</label>
                </div>`;
            fieldDiv.innerHTML = inputHTML; 
        } else {
            inputHTML = `<input type="${f.type}" id="dyn_${f.id}" class="input-field" placeholder="${f.label}" value="${val}">`;
            fieldDiv.innerHTML = `<label class="text-small" style="display:block; margin-bottom:var(--sp-1);">${f.label}</label>${inputHTML}`;
        }

        dynContainer.appendChild(fieldDiv);
    });

    DOM.modals.item.classList.remove('modal--hidden');
};

document.getElementById('btn-new-item').addEventListener('click', () => openItemModal());

mItemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('modal-item-title').value.trim();
    const cover = document.getElementById('modal-item-cover').value.trim();
    const status = document.getElementById('modal-item-status').value;

    const customData = {};
    currentCategory.fields.forEach(f => {
        const inputElement = document.getElementById(`dyn_${f.id}`);
        customData[f.id] = f.type === 'checkbox' ? inputElement.checked : inputElement.value;
    });

    if (currentEditId) {
        const idx = items.findIndex(i => i.id === currentEditId);
        items[idx] = { ...items[idx], title, cover, status, customData };
    } else {
        items.push({ id: Date.now(), categoryId: currentCategory.id, title, cover, status, customData });
    }
    
    DOM.modals.item.classList.add('modal--hidden');
    saveAndRenderItems();
    renderCategories();
});

document.getElementById('btn-delete-item').addEventListener('click', () => {
    if(confirm("Are you sure you want to delete this item?")) {
        items = items.filter(i => i.id !== currentEditId);
        DOM.modals.item.classList.add('modal--hidden');
        saveAndRenderItems();
        renderCategories();
    }
});

// Close Modals
document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', () => { 
        DOM.modals.item.classList.add('modal--hidden'); 
        DOM.modals.category.classList.add('modal--hidden'); 
    });
});

// Initialization
document.addEventListener('DOMContentLoaded', renderCategories);