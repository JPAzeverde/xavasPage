document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('objectviesHome');
    const tasks = JSON.parse(localStorage.getItem('operations_tasks')) || [];
    
    // Filtra objetivos ativos e ordena por prazo mais próximo
    const inProgress = tasks
        .filter(t => t.status === 'in-progress')
        .sort((a, b) => (!a.deadline ? 1 : !b.deadline ? -1 : new Date(a.deadline) - new Date(b.deadline)))
        .slice(0, 4); // Limita a 4 para não quebrar o layout da coluna

    if (!inProgress.length) {
        container.innerHTML = '<p class="empty-msg">No active objectives right now.</p>';
        return;
    }

    container.innerHTML = inProgress.map(task => {
        const dateStr = task.deadline ? `Due: ${task.deadline.split('-').reverse().join('/')}` : 'No deadline';
        return `
            <article class="list-card">
                <h4 class="list-card__title">${task.title}</h4>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
                    ${task.tag ? `<span class="list-card__meta">[${task.tag}]</span>` : '<span></span>'}
                    <span class="list-card__meta">${dateStr}</span>
                </div>
            </article>`;
    }).join('');
});