// ============================================================
// MEDIA EXECUTION: FIREBASE ARRAYS & KANBAN (FINAL CORRIGIDO)
// ============================================================
import { db, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from '../core/firebase-config.js';

let categories = [];
let items = [];
let currentCategory = null; 
let currentEditId = null; 
let tempCategoryFields = []; 

const DOM = {
    views: { hub: document.getElementById('view-categories'), kanban: document.getElementById('view-category-details') },
    ui: { pageTitle: document.getElementById('page-title'), btnBack: document.getElementById('btn-back'), actions: document.getElementById('action-buttons') },
    board: { 'todo': document.getElementById('col-todo'), 'in-progress': document.getElementById('col-in-progress'), 'done': document.getElementById('col-done'), 'dropped': document.getElementById('col-dropped') },
    modals: { category: document.getElementById('modal-category'), item: document.getElementById('modal-item') }
};

// --- RENDERIZAÇÃO DE CATEGORIAS ---
const renderCategories = () => {
    Array.from(DOM.views.hub.children).forEach(child => {
        if (child.id !== 'btn-new-category') child.remove();
    });

    categories.forEach(cat => {
        const count = items.filter(i => i.categoryId === cat.id).length;
        const card = document.createElement('div');
        card.className = 'media-category-card';
        card.innerHTML = `<button class="media-card-del" data-id="${cat.id}">X</button><h3 class="txt-heading-md">${cat.name}</h3><p class="txt-micro" style="margin-top: 4px;">${count} ELEMENTS</p>`;

        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('media-card-del')) return;
            openCategory(cat);
        });

        card.querySelector('.media-card-del').addEventListener('click', async (e) => {
            e.stopPropagation();
            if(confirm(`SYS.WARN: Terminate array "${cat.name}" and ALL child elements?`)) {
                try {
                    await deleteDoc(doc(db, "entertainment_categories", cat.id));
                    const childItems = items.filter(i => i.categoryId === cat.id);
                    for(const i of childItems) await deleteDoc(doc(db, "entertainment_items", i.id));
                } catch(err) { console.error("Erro ao deletar categoria:", err); }
            }
        });

        DOM.views.hub.insertBefore(card, document.getElementById('btn-new-category'));
    });
    
    if(currentCategory) renderBoard();
};

const openCategory = (categoryObj) => {
    currentCategory = categoryObj;
    DOM.views.hub.style.display = 'none';
    DOM.views.kanban.style.display = 'block';
    DOM.ui.pageTitle.innerText = `Array: ${categoryObj.name}`;
    DOM.ui.btnBack.style.display = 'block';
    DOM.ui.actions.style.display = 'flex';
    renderBoard(); 
};

DOM.ui.btnBack.addEventListener('click', () => {
    currentCategory = null;
    DOM.views.kanban.style.display = 'none';
    DOM.views.hub.style.display = 'grid';
    DOM.ui.pageTitle.innerText = 'Media Arrays (Categories)';
    DOM.ui.btnBack.style.display = 'none';
    DOM.ui.actions.style.display = 'none';
    renderCategories();
});

// --- RENDERIZAÇÃO DO BOARD ---
const renderBoard = () => {
    Object.keys(DOM.board).forEach(key => {
        if(DOM.board[key]) {
            DOM.board[key].innerHTML = '';
            document.getElementById(`count-${key}`).textContent = '0';
        }
    });

    const catItems = items.filter(i => i.categoryId === currentCategory?.id);

    catItems.forEach(item => {
        const card = document.createElement('article');
        card.className = 'kanban-card kanban-card--media';
        card.draggable = true;
        card.dataset.id = item.id;
        card.innerHTML = `<img src="${item.cover || ''}" alt="Cover" class="kanban-card__cover" draggable="false"><h4 class="kanban-card__title">${item.title}</h4>`;
        
        card.addEventListener('dragstart', (e) => {
            card.classList.add('is-dragging');
            e.dataTransfer.setData('text/plain', item.id); 
        });
        card.addEventListener('dragend', () => card.classList.remove('is-dragging'));
        card.addEventListener('click', () => openItemModal(item.id));
        
        if(DOM.board[item.status]) DOM.board[item.status].appendChild(card);
    });

    Object.keys(DOM.board).forEach(key => {
        if(document.getElementById(`count-${key}`)) {
            document.getElementById(`count-${key}`).textContent = catItems.filter(i => i.status === key).length;
        }
    });
};

Object.values(DOM.board).forEach(column => {
    if(!column) return;
    const parentCol = column.parentElement;
    parentCol.addEventListener('dragover', e => { e.preventDefault(); parentCol.classList.add('is-dragover'); });
    parentCol.addEventListener('dragleave', () => parentCol.classList.remove('is-dragover'));
    parentCol.addEventListener('drop', async e => {
        e.preventDefault();
        parentCol.classList.remove('is-dragover');
        const itemId = e.dataTransfer.getData('text/plain');
        const newStatus = parentCol.dataset.status;
        
        if(itemId && newStatus) {
            try { await updateDoc(doc(db, "entertainment_items", itemId), { status: newStatus }); } 
            catch(err) { console.error("Erro ao atualizar status:", err); }
        }
    });
});

// --- CRIAÇÃO DE CATEGORIA ---
const catFieldsList = document.getElementById('cat-fields-list');
const inputCatType = document.getElementById('new-field-type');
const inputCatOptions = document.getElementById('new-field-options');

inputCatType.addEventListener('change', (e) => {
    const type = (e.target.value || '').toLowerCase();
    inputCatOptions.style.display = type === 'select' ? 'block' : 'none';
});

const renderTempFields = () => {
    catFieldsList.innerHTML = '';
    tempCategoryFields.forEach((f, index) => {
        const div = document.createElement('div');
        div.style = "display: flex; justify-content: space-between; padding: var(--sp-2); background: var(--bg-base); border: 1px solid var(--border-base); margin-bottom: 4px;";
        div.innerHTML = `<span class="txt-micro">${f.label} <span style="color:var(--text-muted)">(${f.type})</span></span><button type="button" class="btn--danger-mini" style="background:transparent; border:none; color:var(--accent-alert); cursor:pointer;">X</button>`;
        div.querySelector('button').addEventListener('click', () => { tempCategoryFields.splice(index, 1); renderTempFields(); });
        catFieldsList.appendChild(div);
    });
};

document.getElementById('btn-add-field').addEventListener('click', () => {
    const label = document.getElementById('new-field-label').value.trim();
    const type = (inputCatType.value || '').toLowerCase();
    
    if (!label) return alert("SYS.ERR: Parameter name required.");
    
    let options = [];
    if (type === 'select') {
        options = inputCatOptions.value.split(',').map(s => s.trim()).filter(s => s !== '');
    }

    tempCategoryFields.push({ 
        id: 'f_' + Date.now() + Math.floor(Math.random() * 1000), 
        label, 
        type, 
        options 
    });
    
    document.getElementById('new-field-label').value = '';
    inputCatOptions.value = '';
    renderTempFields();
});

document.getElementById('form-category').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        await addDoc(collection(db, "entertainment_categories"), {
            name: document.getElementById('cat-name').value.trim(),
            fields: tempCategoryFields
        });
        
        // Limpa o formulário e fecha o modal
        document.getElementById('form-category').reset();
        tempCategoryFields = []; 
        renderTempFields();
        DOM.modals.category.classList.add('modal--hidden');
        
    } catch(err) { console.error("Erro ao salvar categoria:", err); }
});

document.getElementById('btn-new-category').addEventListener('click', () => {
    document.getElementById('form-category').reset();
    tempCategoryFields = []; 
    renderTempFields();
    DOM.modals.category.classList.remove('modal--hidden');
});

// --- CRIAÇÃO DE ITEMS (MÍDIA) ---
const mItemForm = document.getElementById('form-item');
const dynContainer = document.getElementById('dynamic-fields-container');

const openItemModal = (id = null) => {
    currentEditId = id;
    const item = id ? items.find(i => i.id === id) : {};
    
    document.getElementById('modal-item-title-display').innerText = id ? 'Reconfigure Media Element' : 'Inject Media Element';
    document.getElementById('modal-item-title').value = item.title || '';
    document.getElementById('modal-item-cover').value = item.cover || '';
    document.getElementById('modal-item-status').value = item.status || 'todo';
    document.getElementById('btn-delete-item').style.display = id ? 'block' : 'none';

    dynContainer.innerHTML = '';
    
    if (currentCategory && currentCategory.fields) {
        currentCategory.fields.forEach(f => {
            const val = item.customData ? (item.customData[f.id] ?? '') : '';
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'form-group';
            
            const fieldType = (f.type || 'text').toLowerCase();
            
            if (fieldType === 'select') {
                const safeOptions = Array.isArray(f.options) ? f.options : [];
                const optionsHTML = safeOptions.map(opt => `<option value="${opt}" ${val === opt ? 'selected' : ''}>${opt}</option>`).join('');
                fieldDiv.innerHTML = `<label class="txt-micro">${f.label}</label><select id="dyn_${f.id}" class="input-field"><option value="">Select...</option>${optionsHTML}</select>`;
            } else if (fieldType === 'checkbox') {
                fieldDiv.innerHTML = `<div style="display: flex; align-items: center; gap: var(--sp-2);"><input type="checkbox" id="dyn_${f.id}" ${(val === true || val === 'true') ? 'checked' : ''}><label for="dyn_${f.id}" class="txt-micro">${f.label}</label></div>`;
            } else {
                fieldDiv.innerHTML = `<label class="txt-micro">${f.label}</label><input type="${fieldType}" id="dyn_${f.id}" class="input-field" value="${val}">`;
            }
            dynContainer.appendChild(fieldDiv);
        });
    }
    DOM.modals.item.classList.remove('modal--hidden');
};

document.getElementById('btn-new-item').addEventListener('click', () => {
    mItemForm.reset();
    openItemModal();
});

mItemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const customData = {};
    
    if (currentCategory && currentCategory.fields) {
        currentCategory.fields.forEach(f => {
            const el = document.getElementById(`dyn_${f.id}`);
            if (el) {
                const fieldType = (f.type || '').toLowerCase();
                customData[f.id] = fieldType === 'checkbox' ? el.checked : el.value;
            }
        });
    }

    const payload = {
        categoryId: currentCategory.id,
        title: document.getElementById('modal-item-title').value.trim(),
        cover: document.getElementById('modal-item-cover').value.trim(),
        status: document.getElementById('modal-item-status').value,
        customData
    };

    try {
        if (currentEditId) {
            await updateDoc(doc(db, "entertainment_items", currentEditId), payload);
        } else {
            await addDoc(collection(db, "entertainment_items"), payload);
        }
        
        // Limpa o formulário, zera o ID de edição e fecha o modal
        mItemForm.reset();
        currentEditId = null;
        DOM.modals.item.classList.add('modal--hidden');
        
    } catch(err) { 
        console.error("Erro crítico ao salvar item no Firebase:", err); 
        alert("Erro ao salvar item. Verifique o console.");
    }
});

document.getElementById('btn-delete-item').addEventListener('click', async () => {
    if(confirm("SYS.WARN: Scrub element from database?")) {
        try {
            await deleteDoc(doc(db, "entertainment_items", currentEditId));
            
            // Limpa após deletar
            mItemForm.reset();
            currentEditId = null;
            DOM.modals.item.classList.add('modal--hidden');
        } catch(err) { console.error(err); }
    }
});

document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', () => { 
        // Esconde os modais e limpa a memória/formulários se o usuário cancelar
        DOM.modals.item.classList.add('modal--hidden'); 
        DOM.modals.category.classList.add('modal--hidden'); 
        
        mItemForm.reset();
        document.getElementById('form-category').reset();
        currentEditId = null;
    });
});

// --- INICIALIZAÇÃO FIREBASE ---
document.addEventListener('DOMContentLoaded', () => {
    onSnapshot(collection(db, "entertainment_categories"), (snapshot) => {
        categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderCategories();
    });
    onSnapshot(collection(db, "entertainment_items"), (snapshot) => {
        items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderCategories(); 
    });
});