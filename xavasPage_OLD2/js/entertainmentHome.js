document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('entertainmentHome');
    const items = JSON.parse(localStorage.getItem('entertainment_items')) || [];
    
    // Filtra apenas os que estão "Em Andamento" - SEM LIMITADOR
    const inProgress = items.filter(t => t.status === 'in-progress');

    if (!inProgress.length) {
        container.innerHTML = '<p class="empty-msg">No entertainment currently active.</p>';
        return;
    }

    container.innerHTML = inProgress.map(item => `
        <article class="list-card list-card--ent">
            <img src="${item.cover}" alt="Cover" class="list-card__cover">
            <div style="display: flex; flex-direction: column; overflow: hidden;">
                <h4 class="list-card__title" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title}</h4>
                <span class="list-card__meta">Active</span>
            </div>
        </article>
    `).join('');
});