document.addEventListener('DOMContentLoaded', () => {
    // 1. Busca as tasks salvas na página Operations
    const savedTasks = JSON.parse(localStorage.getItem('operations_tasks')) || [];
    const objectivesContainer = document.getElementById('objectviesHome');

    // 2. Filtra apenas as que estão 'Em Andamento' (in-progress)
    const inProgressTasks = savedTasks.filter(task => task.status === 'in-progress');

    // 3. Ordena pela data mais próxima
    inProgressTasks.sort((a, b) => {
        if (!a.deadline && b.deadline) return 1;
        if (a.deadline && !b.deadline) return -1;
        if (!a.deadline && !b.deadline) return 0;
        
        return new Date(a.deadline) - new Date(b.deadline);
    });

    // ==========================================
    // LIMITADOR DE TAREFAS (Pega apenas as 6 primeiras)
    // ==========================================
    const top6Tasks = inProgressTasks.slice(0, 6);

    // 4. Renderiza no HTML
    if (top6Tasks.length === 0) {
        objectivesContainer.innerHTML = `<p class="empty-objectives">Nenhum objetivo em andamento no momento.</p>`;
        return;
    }

    // Cria o container do grid
    const grid = document.createElement('div');
    grid.className = 'objectives-grid';

    // Usando a nova variável top6Tasks no lugar da antiga
    top6Tasks.forEach(task => {
        const card = document.createElement('div');
        card.className = 'objective-card';

        // Formatação da Data (YYYY-MM-DD para DD/MM/AAAA)
        let dataFormatada = 'Sem prazo definido';
        if (task.deadline) {
            const [ano, mes, dia] = task.deadline.split('-');
            dataFormatada = `Prazo: ${dia}/${mes}/${ano}`;
        }

        // Recuperar a tag se existir e formatar
        let tagInfo = '';
        if (task.tag) {
            const tagLabel = task.tag.charAt(0).toUpperCase() + task.tag.slice(1);
            tagInfo = `<span class="tag-protocol" style="font-size: 10px; margin-bottom: 4px;">[${tagLabel}]</span>`;
        }

        card.innerHTML = `
            ${tagInfo}
            <h4 class="objective-title">${task.title}</h4>
            <span class="objective-date">${dataFormatada}</span>
        `;

        grid.appendChild(card);
    });

    objectivesContainer.innerHTML = ''; // Limpa o container
    objectivesContainer.appendChild(grid); // Adiciona os cards
});