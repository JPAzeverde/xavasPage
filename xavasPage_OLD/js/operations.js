document.addEventListener('DOMContentLoaded', () => {
    // Banco de dados em LocalStorage (com as tags adicionadas)
    let tasks = JSON.parse(localStorage.getItem('operations_tasks')) || [
        { id: 1, title: 'Criar app de automação', status: 'todo', tag: 'pessoal', deadline: '2026-08-01', details: 'Focar em Python e Selenium.' },
        { id: 2, title: 'Criar app de academia', status: 'in-progress', tag: 'pessoal', deadline: '', details: 'Usar React Native. Módulos de ficha de treino.' },
        { id: 3, title: 'Atualizar sistema interno', status: 'todo', tag: 'solargun', deadline: '', details: 'Verificar logs de erro.' },
        { id: 4, title: 'Trabalho de Conclusão', status: 'todo', tag: 'unilavras', deadline: '', details: 'Formatar nas normas ABNT.' }
    ];

    let currentEditId = null;

    // Dicionário de Tags para renderização
    const tagMap = {
        'unilavras': { label: 'Unilavras', class: 'tag-unilavras' },
        'solargun': { label: 'SolarGun', class: 'tag-solargun' },
        'pessoal': { label: 'Pessoal', class: 'tag-pessoal' }
    };

    // Elementos do DOM
    const board = {
        'todo': document.querySelector('#col-todo .column-content'),
        'in-progress': document.querySelector('#col-in-progress .column-content'),
        'done': document.querySelector('#col-done .column-content'),
        'dropped': document.querySelector('#col-dropped .column-content')
    };

    const modal = document.getElementById('task-modal');
    const mTitle = document.getElementById('modal-title');
    const mStatus = document.getElementById('modal-status');
    const mTag = document.getElementById('modal-tag'); // Novo elemento de Tag
    const mDeadline = document.getElementById('modal-deadline');
    const mDetails = document.getElementById('modal-details');

    // ==========================================
    // SISTEMA DE DRAG AND DROP (ARRASTAR E SOLTAR)
    // ==========================================
    const columns = document.querySelectorAll('.kanban-column');
    
    columns.forEach(column => {
        const contentArea = column.querySelector('.column-content');
        
        column.addEventListener('dragover', (e) => {
            e.preventDefault(); 
            column.classList.add('drag-over');
        });

        column.addEventListener('dragleave', () => {
            column.classList.remove('drag-over');
        });

        column.addEventListener('drop', (e) => {
            e.preventDefault();
            column.classList.remove('drag-over');
            
            const taskId = e.dataTransfer.getData('text/plain');
            const newStatus = contentArea.getAttribute('data-status');
            
            if(taskId && newStatus) {
                const taskIndex = tasks.findIndex(t => t.id.toString() === taskId);
                if(taskIndex > -1 && tasks[taskIndex].status !== newStatus) {
                    tasks[taskIndex].status = newStatus;
                    saveAndRender(); 
                }
            }
        });
    });

    // ==========================================
    // RENDERIZAÇÃO E SALVAMENTO
    // ==========================================
    function saveAndRender() {
        localStorage.setItem('operations_tasks', JSON.stringify(tasks));
        renderBoard();
    }

    function renderBoard() {
        // Limpar colunas e contadores
        Object.keys(board).forEach(key => {
            board[key].innerHTML = '';
            document.querySelector(`#col-${key} .task-count`).textContent = '0';
        });

        // ==========================================
        // LÓGICA DE ORDENAÇÃO (Mais próximos no topo)
        // ==========================================
        const tasksOrdenadas = [...tasks].sort((a, b) => {
            // Se 'a' não tem prazo e 'b' tem, 'b' sobe
            if (!a.deadline && b.deadline) return 1;
            // Se 'a' tem prazo e 'b' não tem, 'a' sobe
            if (a.deadline && !b.deadline) return -1;
            // Se nenhum dos dois tem prazo, mantém a ordem
            if (!a.deadline && !b.deadline) return 0;
            
            // Se ambos têm prazo, compara quem está mais perto
            return new Date(a.deadline) - new Date(b.deadline);
        });

        // Agora usamos 'tasksOrdenadas' em vez de 'tasks'
        tasksOrdenadas.forEach(task => {
            const card = document.createElement('div');
            card.className = 'task-card';
            card.setAttribute('draggable', 'true');
            card.setAttribute('data-id', task.id);

            // Montagem da Tag HTML se a tag existir no mapa
            let tagHtml = '';
            if (task.tag && tagMap[task.tag]) {
                tagHtml = `<span class="task-tag ${tagMap[task.tag].class}">${tagMap[task.tag].label}</span>`;
            }

            // Formatação da Data (de YYYY-MM-DD para DD/MM/AAAA)
            let dataFormatada = '';
            if (task.deadline) {
                const [ano, mes, dia] = task.deadline.split('-'); // Separa a data pelos traços
                dataFormatada = `${dia}/${mes}/${ano}`; // Remonta no padrão brasileiro
            }

            card.innerHTML = `
                
                <h4>${task.title}</h4>
                ${tagHtml}
                ${dataFormatada ? `<span class="task-date">Prazo: ${dataFormatada}</span>` : ''}
            `;
            
            card.addEventListener('dragstart', (e) => {
                card.classList.add('dragging');
                e.dataTransfer.setData('text/plain', task.id); 
            });

            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
            });
            
            card.addEventListener('click', () => openModal(task.id));
            
            board[task.status].appendChild(card);
        });

        // Atualizar contadores
        Object.keys(board).forEach(key => {
            const count = tasks.filter(t => t.status === key).length;
            document.querySelector(`#col-${key} .task-count`).textContent = count;
        });
    }

    // ==========================================
    // CONTROLE DO MODAL
    // ==========================================
    function openModal(id = null) {
        currentEditId = id;
        if (id) {
            const task = tasks.find(t => t.id === id);
            mTitle.value = task.title;
            mStatus.value = task.status;
            mTag.value = task.tag || ''; // Carrega a tag existente
            mDeadline.value = task.deadline || '';
            mDetails.value = task.details || '';
            document.getElementById('btn-delete-task').style.display = 'block';
        } else {
            mTitle.value = '';
            mStatus.value = 'todo';
            mTag.value = ''; // Reseta a tag
            mDeadline.value = '';
            mDetails.value = '';
            document.getElementById('btn-delete-task').style.display = 'none';
        }
        modal.classList.add('active');
    }

    function closeModal() {
        modal.classList.remove('active');
        currentEditId = null;
    }

    // Listeners dos Botões do Modal
    document.getElementById('btn-add-task').addEventListener('click', () => openModal());
    document.getElementById('btn-close-modal').addEventListener('click', closeModal);

    document.getElementById('btn-save-task').addEventListener('click', () => {
        const title = mTitle.value.trim() || 'Sem Título';
        if (currentEditId) {
            const taskIndex = tasks.findIndex(t => t.id === currentEditId);
            tasks[taskIndex] = {
                id: currentEditId,
                title: title,
                status: mStatus.value,
                tag: mTag.value, // Salva a tag
                deadline: mDeadline.value,
                details: mDetails.value
            };
        } else {
            tasks.push({
                id: Date.now(),
                title: title,
                status: mStatus.value,
                tag: mTag.value, // Salva a tag
                deadline: mDeadline.value,
                details: mDetails.value
            });
        }
        closeModal();
        saveAndRender();
    });

    document.getElementById('btn-delete-task').addEventListener('click', () => {
        if(confirm("Tem certeza que deseja deletar este projeto?")) {
            tasks = tasks.filter(t => t.id !== currentEditId);
            closeModal();
            saveAndRender();
        }
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Inicialização
    renderBoard();
});