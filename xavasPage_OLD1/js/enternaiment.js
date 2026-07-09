document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // ESTADO GLOBAL & BANCO DE DADOS
    // ==========================================
    
    // Categorias default
    let categories = JSON.parse(localStorage.getItem('entertainment_categories')) || [
        {
            id: 'cat_1',
            name: 'Games',
            fields: [
                { id: 'f_1', label: 'Console', type: 'select', options: ['PS5', 'Xbox', 'PC', 'Switch'] },
                { id: 'f_2', label: 'Ano de Lançamento', type: 'number' },
                { id: 'f_3', label: 'Nota (0 a 100)', type: 'number' }
            ]
        }
    ];

    let items = JSON.parse(localStorage.getItem('entertainment_items')) || [];

    let currentCategory = null; 
    let currentEditId = null;   
    
    // Variável temporária para guardar campos enquanto criamos uma categoria
    let tempCategoryFields = []; 

    // Elementos da UI base
    const views = { hub: document.getElementById('view-categories'), kanban: document.getElementById('view-category-details') };
    const ui = { pageTitle: document.getElementById('page-title'), btnBack: document.getElementById('btn-back'), actionButtons: document.getElementById('action-buttons') };
    
    const board = {
        'todo': document.querySelector('#col-todo .column-content'),
        'in-progress': document.querySelector('#col-in-progress .column-content'),
        'dropped': document.querySelector('#col-dropped .column-content'),
        'done': document.querySelector('#col-done .column-content')
    };

    // ==========================================
    // RENDERIZAR E GERENCIAR CATEGORIAS (HUB)
    // ==========================================
    function saveCategories() {
        localStorage.setItem('entertainment_categories', JSON.stringify(categories));
        renderCategories();
    }

    function renderCategories() {
        const container = views.hub;
        // Limpa tudo menos o botão de "Nova Categoria"
        Array.from(container.children).forEach(child => {
            if (child.id !== 'btn-new-category') child.remove();
        });

        categories.forEach(cat => {
            const count = items.filter(i => i.categoryId === cat.id).length;
            
            const card = document.createElement('div');
            card.className = 'card category-card';
            card.innerHTML = `
                <div style="width:100%; display:flex; justify-content:flex-end;">
                    <button class="btn-danger-mini btn-del-cat" data-id="${cat.id}">X</button>
                </div>
                <h3>${cat.name}</h3>
                <p>${count} itens</p>
            `;

            // Clique no card abre a categoria
            card.addEventListener('click', (e) => {
                if(e.target.classList.contains('btn-del-cat')) return; // Evita abrir se clicar em excluir
                openCategory(cat);
            });

            // Clique no botão exclui
            card.querySelector('.btn-del-cat').addEventListener('click', (e) => {
                e.stopPropagation();
                if(confirm(`Excluir a categoria "${cat.name}" e TODOS os seus itens?`)) {
                    categories = categories.filter(c => c.id !== cat.id);
                    items = items.filter(i => i.categoryId !== cat.id); // Apaga os itens em cascata
                    saveCategories();
                    saveAndRenderItems(); // Atualiza localstorage dos itens
                }
            });

            container.insertBefore(card, document.getElementById('btn-new-category'));
        });
    }

    // ==========================================
    // LÓGICA DO MODAL DE NOVA CATEGORIA
    // ==========================================
    const mCat = document.getElementById('modal-category');
    const inputCatType = document.getElementById('new-field-type');
    const inputCatOptions = document.getElementById('new-field-options');
    const catFieldsList = document.getElementById('cat-fields-list');

    // Mostra/Esconde input de opções se escolher "Select"
    inputCatType.addEventListener('change', (e) => {
        inputCatOptions.style.display = e.target.value === 'select' ? 'block' : 'none';
    });

    // Adiciona campo temporário
    document.getElementById('btn-add-field').addEventListener('click', () => {
        const label = document.getElementById('new-field-label').value.trim();
        const type = inputCatType.value;
        const options = inputCatOptions.value.split(',').map(s => s.trim()).filter(s => s);

        if (!label) return alert("Dê um nome ao campo!");
        if (type === 'select' && options.length === 0) return alert("Insira opções separadas por vírgula!");

        const field = { id: 'f_' + Date.now(), label, type, options };
        tempCategoryFields.push(field);
        
        // Limpa inputs
        document.getElementById('new-field-label').value = '';
        inputCatOptions.value = '';
        
        renderTempFields();
    });

    function renderTempFields() {
        catFieldsList.innerHTML = '';
        tempCategoryFields.forEach((f, index) => {
            const div = document.createElement('div');
            div.style = "display:flex; justify-content:space-between; background:var(--bg-black); padding:var(--sp-2); border-radius:var(--rad-sm);";
            div.innerHTML = `<span style="font-size:0.9rem;">${f.label} <small>(${f.type})</small></span>
                             <button type="button" class="btn-danger-mini" onclick="removeTempField(${index})">Remover</button>`;
            catFieldsList.appendChild(div);
        });
    }

    // Função global para remover campo temporário
    window.removeTempField = function(index) {
        tempCategoryFields.splice(index, 1);
        renderTempFields();
    };

    // Salvar Categoria
    document.getElementById('form-category').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('cat-name').value.trim();
        
        categories.push({ id: 'cat_' + Date.now(), name, fields: [...tempCategoryFields] });
        saveCategories();
        
        mCat.style.display = 'none';
    });

    document.getElementById('btn-new-category').addEventListener('click', () => {
        document.getElementById('cat-name').value = '';
        tempCategoryFields = [];
        renderTempFields();
        mCat.style.display = 'flex';
    });

    // ==========================================
    // SISTEMA DE VIEWS (Hub -> Kanban)
    // ==========================================
    function openCategory(categoryObj) {
        currentCategory = categoryObj;
        views.hub.style.display = 'none';
        views.kanban.style.display = 'block';
        ui.pageTitle.innerText = `Entertainment > ${categoryObj.name}`;
        ui.btnBack.style.display = 'block';
        ui.actionButtons.style.display = 'flex';
        renderBoard(); 
    }

    ui.btnBack.addEventListener('click', () => {
        currentCategory = null;
        views.kanban.style.display = 'none';
        views.hub.style.display = 'grid';
        ui.pageTitle.innerText = 'Entertainment';
        ui.btnBack.style.display = 'none';
        ui.actionButtons.style.display = 'none';
        renderCategories(); // Atualiza contadores
    });

    // ==========================================
    // RENDERIZAR KANBAN & ITENS
    // ==========================================
    function saveAndRenderItems() {
        localStorage.setItem('entertainment_items', JSON.stringify(items));
        if(currentCategory) renderBoard();
    }

    function renderBoard() {
        Object.keys(board).forEach(key => {
            board[key].innerHTML = '';
            document.querySelector(`#count-${key}`).textContent = '0';
        });

        const catItems = items.filter(i => i.categoryId === currentCategory.id);

        catItems.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card item-card';
            card.setAttribute('draggable', 'true');
            card.setAttribute('data-id', item.id);
            card.style.cursor = 'grab';

            card.innerHTML = `
                <img src="${item.cover}" alt="Capa" draggable="false">
                <h4>${item.title}</h4>
            `;
            
            // Drag and Drop events
            card.addEventListener('dragstart', (e) => {
                card.classList.add('dragging');
                e.dataTransfer.setData('text/plain', item.id); 
            });
            card.addEventListener('dragend', () => card.classList.remove('dragging'));
            card.addEventListener('click', () => openItemModal(item.id));
            
            board[item.status].appendChild(card);
        });

        Object.keys(board).forEach(key => {
            document.querySelector(`#count-${key}`).textContent = catItems.filter(i => i.status === key).length;
        });
    }

    // Drag and Drop (Colunas)
    document.querySelectorAll('.kanban-column').forEach(column => {
        const contentArea = column.querySelector('.column-content');
        column.addEventListener('dragover', e => { e.preventDefault(); column.classList.add('drag-over'); });
        column.addEventListener('dragleave', () => column.classList.remove('drag-over'));
        column.addEventListener('drop', e => {
            e.preventDefault();
            column.classList.remove('drag-over');
            const itemId = e.dataTransfer.getData('text/plain');
            const newStatus = contentArea.getAttribute('data-status');
            
            if(itemId && newStatus) {
                const itemIndex = items.findIndex(i => i.id.toString() === itemId);
                if(itemIndex > -1 && items[itemIndex].status !== newStatus) {
                    items[itemIndex].status = newStatus;
                    saveAndRenderItems(); 
                }
            }
        });
    });

    // ==========================================
    // LÓGICA DO MODAL DE ITEM (GERADOR DINÂMICO)
    // ==========================================
    const mItem = document.getElementById('modal-item');
    const dynContainer = document.getElementById('dynamic-fields-container');

    function openItemModal(id = null) {
        currentEditId = id;
        const item = id ? items.find(i => i.id === id) : {};
        
        document.getElementById('modal-title-display').innerText = id ? 'Editar Item' : 'Cadastrar Item';
        document.getElementById('modal-title').value = item.title || '';
        document.getElementById('modal-cover').value = item.cover || '';
        document.getElementById('modal-status').value = item.status || 'todo';
        document.getElementById('btn-delete-item').style.display = id ? 'block' : 'none';

        // Geração Dinâmica de Inputs com base na Categoria Atual
        // Geração Dinâmica de Inputs com base na Categoria Atual
        dynContainer.innerHTML = '';
        currentCategory.fields.forEach(f => {
            const val = item.customData ? (item.customData[f.id] ?? '') : '';
            
            const fieldDiv = document.createElement('div');
            let inputHTML = '';

            if (f.type === 'select') {
                const optionsHTML = f.options.map(opt => `<option value="${opt}" ${val === opt ? 'selected' : ''}>${opt}</option>`).join('');
                inputHTML = `<select id="dyn_${f.id}"><option value="">Selecione...</option>${optionsHTML}</select>`;
                fieldDiv.innerHTML = `<label style="font-size:0.8rem; color:var(--txt-light-grey); margin-bottom:var(--sp-1); display:block;">${f.label}</label>${inputHTML}`;
            
            } else if (f.type === 'checkbox') {
                // Checkbox precisa lidar com a propriedade 'checked' em vez de 'value'
                const isChecked = (val === true || val === 'true') ? 'checked' : '';
                // Ajustamos o layout para o checkbox ficar ao lado do texto e anular o width: 100% do CSS
                inputHTML = `
                    <div style="display: flex; align-items: center; gap: var(--sp-2);">
                        <input type="checkbox" id="dyn_${f.id}" ${isChecked} style="width: auto; cursor: pointer;">
                        <label for="dyn_${f.id}" style="color:var(--txt-light-grey); margin:0; cursor: pointer;">${f.label}</label>
                    </div>`;
                fieldDiv.innerHTML = inputHTML; // Não usamos a label superior padrão aqui
            
            } else {
                inputHTML = `<input type="${f.type}" id="dyn_${f.id}" placeholder="${f.label}" value="${val}">`;
                fieldDiv.innerHTML = `<label style="font-size:0.8rem; color:var(--txt-light-grey); margin-bottom:var(--sp-1); display:block;">${f.label}</label>${inputHTML}`;
            }

            dynContainer.appendChild(fieldDiv);
        });

        mItem.style.display = 'flex';
    }

    document.getElementById('btn-new-item').addEventListener('click', () => openItemModal());

    document.getElementById('btn-save-item').addEventListener('click', () => {
        const title = document.getElementById('modal-title').value.trim();
        const cover = document.getElementById('modal-cover').value.trim();
        const status = document.getElementById('modal-status').value;

        if (!title || !cover) return alert('Título e URL da Capa são obrigatórios!');

        // Coleta dados dos inputs dinâmicos
        // Coleta dados dos inputs dinâmicos
        const customData = {};
        currentCategory.fields.forEach(f => {
            const inputElement = document.getElementById(`dyn_${f.id}`);
            if (f.type === 'checkbox') {
                customData[f.id] = inputElement.checked; // Salva true ou false
            } else {
                customData[f.id] = inputElement.value; // Salva o texto/número
            }
        });

        if (currentEditId) {
            const idx = items.findIndex(i => i.id === currentEditId);
            items[idx] = { ...items[idx], title, cover, status, customData };
        } else {
            items.push({ id: Date.now(), categoryId: currentCategory.id, title, cover, status, customData });
        }
        
        mItem.style.display = 'none';
        saveAndRenderItems();
        renderCategories(); // Para atualizar contagem
    });

    document.getElementById('btn-delete-item').addEventListener('click', () => {
        if(confirm("Tem certeza que deseja deletar este item?")) {
            items = items.filter(i => i.id !== currentEditId);
            mItem.style.display = 'none';
            saveAndRenderItems();
            renderCategories();
        }
    });

    // Controles de fechamento de modais
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
        btn.addEventListener('click', () => { mItem.style.display = 'none'; mCat.style.display = 'none'; });
    });

    // Inicia a aplicação
    renderCategories();
});