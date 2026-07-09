const renderHomeSupplies = () => {
    const container = document.getElementById('supplies-home');
    if (!container) return;

    const inventory = JSON.parse(localStorage.getItem('hub_inventory')) || [];
    
    // Filtra apenas itens em estoque ou abertos
    const activeItems = inventory.filter(i => i.status === 'in-stock' || i.status === 'opened');

    if (!activeItems.length) {
        container.innerHTML = '<p class="empty-msg">No active supplies.</p>';
        return;
    }

    container.innerHTML = activeItems.map(item => {
        const isOpened = item.status === 'opened';
        return `
            <div class="supply-row ${isOpened ? 'supply-row--opened' : 'supply-row--stock'}">
                <div class="supply-row__info">
                    <span class="supply-row__name" title="${item.name}">${item.name}</span>
                    <span class="supply-row__status">${isOpened ? 'In Use' : 'Stock'}</span>
                </div>
                <button class="btn ${isOpened ? 'btn--danger-mini' : 'btn--ghost'}" 
                        style="font-size: 0.6rem; padding: 4px 8px;" 
                        onclick="${isOpened ? 'finishSupply' : 'openSupply'}('${item.id}')">
                    ${isOpened ? 'Finish' : 'Open'}
                </button>
            </div>
        `;
    }).join('');
};

window.openSupply = (id) => updateStatus(id, 'opened', 'dateOpened');
window.finishSupply = (id) => updateStatus(id, 'ended', 'dateEnded');

const updateStatus = (id, status, dateField) => {
    let inventory = JSON.parse(localStorage.getItem('hub_inventory')) || [];
    const idx = inventory.findIndex(i => i.id === id);
    if (idx > -1) {
        inventory[idx].status = status;
        inventory[idx][dateField] = new Date().toISOString().split('T')[0];
        localStorage.setItem('hub_inventory', JSON.stringify(inventory));
        renderHomeSupplies();
    }
};

document.addEventListener('DOMContentLoaded', renderHomeSupplies);