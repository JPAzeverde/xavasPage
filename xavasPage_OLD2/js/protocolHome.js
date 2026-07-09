const getTodayMarkedTasks = () => {
    const todayStr = new Date().toDateString();
    const stored = JSON.parse(localStorage.getItem('protocol_marked_tasks')) || {};
    return stored.date === todayStr ? stored : { date: todayStr, taskIds: [] };
};

const renderTodayTasks = () => {
    const container = document.getElementById('nexts-protocol');
    if (!container) return;

    const allTasks = JSON.parse(localStorage.getItem('protocol_tasks')) || [];
    const today = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];

    const todayTasks = allTasks.filter(t => t.day === today).sort((a, b) => a.startTime.localeCompare(b.startTime));

    if (!todayTasks.length) {
        container.innerHTML = '<p class="empty-msg">No tasks scheduled for today.</p>';
        return;
    }

    const markedData = getTodayMarkedTasks();
    container.innerHTML = '';

    todayTasks.forEach(task => {
        const card = document.createElement('article');
        const isDone = markedData.taskIds.includes(task.id);
        card.className = `protocol-card-mini ${isDone ? 'is-done' : ''}`;
        
        card.innerHTML = `
            <span class="protocol-card-mini__tag">${task.tag}</span>
            <h4 class="protocol-card-mini__title">${task.task}</h4>
            <span class="protocol-card-mini__time">${task.startTime}${task.endTime ? ' ~ ' + task.endTime : ''}</span>
        `;

        card.addEventListener('click', () => {
            card.classList.toggle('is-done');
            if (card.classList.contains('is-done')) {
                markedData.taskIds.push(task.id);
            } else {
                markedData.taskIds = markedData.taskIds.filter(id => id !== task.id);
            }
            localStorage.setItem('protocol_marked_tasks', JSON.stringify(markedData));
        });

        container.appendChild(card);
    });
};

document.addEventListener('DOMContentLoaded', renderTodayTasks);