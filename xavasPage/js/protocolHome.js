// protocolHome.js

// Função auxiliar: Pega as tarefas marcadas de hoje (se for um novo dia, reseta a lista)
function getTodayMarkedTasks() {
    const todayStr = new Date().toDateString(); // Ex: "Tue Jul 07 2026"
    const stored = JSON.parse(localStorage.getItem('protocol_marked_tasks')) || {};
    
    // Se a data salva for diferente de hoje, retorna uma lista vazia
    if (stored.date !== todayStr) {
        return { date: todayStr, taskIds: [] };
    }
    return stored;
}

// Função auxiliar: Salva as tarefas marcadas no LocalStorage
function saveMarkedTasks(data) {
    localStorage.setItem('protocol_marked_tasks', JSON.stringify(data));
}

function renderTodayTasks() {
    const container = document.getElementById('nexts-protocol');
    if (!container) return;

    container.innerHTML = '';

    const storedData = localStorage.getItem('protocol_tasks');
    const allTasks = storedData ? JSON.parse(storedData) : [];

    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = daysOfWeek[new Date().getDay()];

    const todayTasks = allTasks
        .filter(task => task.day === today)
        .sort((a, b) => {
            const [hoursA, minsA] = a.startTime.split(':').map(Number);
            const [hoursB, minsB] = b.startTime.split(':').map(Number);
            return ((hoursA * 60) + minsA) - ((hoursB * 60) + minsB);
        });

    if (todayTasks.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.style.color = 'var(--txt-grey)';
        emptyMsg.style.width = '100%';
        emptyMsg.style.textAlign = 'center';
        emptyMsg.textContent = 'No tasks scheduled for today.';
        container.appendChild(emptyMsg);
        return;
    }

    // Carrega o histórico de tarefas marcadas de hoje
    const markedData = getTodayMarkedTasks();
    const markedIds = markedData.taskIds;

    todayTasks.forEach(task => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'mini-card card-protocol-home';
        
        // Verifica se a tarefa (pelo ID) já está na lista de marcadas
        if (markedIds.includes(task.id)) {
            cardDiv.classList.add('mark');
        }

        const taskP = document.createElement('p');
        taskP.className = 'task-protocol';
        taskP.textContent = task.task;

        const tagP = document.createElement('p');
        tagP.className = `tag-protocol tag--${task.tag}`;
        tagP.textContent = task.tag.charAt(0).toUpperCase() + task.tag.slice(1);

        const hourP = document.createElement('p');
        hourP.className = 'hour-protocol';
        const endTimeStr = task.endTime ? ` ~ ${task.endTime}` : '';
        hourP.textContent = `${task.startTime}${endTimeStr}`;

        cardDiv.appendChild(taskP);
        cardDiv.appendChild(tagP);
        cardDiv.appendChild(hourP);

        // --- LÓGICA DO CLIQUE (MARCAR/DESMARCAR) ---
        cardDiv.addEventListener('click', () => {
            cardDiv.classList.toggle('mark');
            
            if (cardDiv.classList.contains('mark')) {
                // Adiciona o ID na lista se foi marcado
                markedIds.push(task.id);
            } else {
                // Remove o ID da lista se foi desmarcado
                const index = markedIds.indexOf(task.id);
                if (index > -1) markedIds.splice(index, 1);
            }
            
            // Atualiza o LocalStorage
            markedData.taskIds = markedIds;
            saveMarkedTasks(markedData);
        });

        container.appendChild(cardDiv);
    });
}

document.addEventListener('DOMContentLoaded', renderTodayTasks);