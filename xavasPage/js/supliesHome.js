document.addEventListener('DOMContentLoaded', () => {
    renderHomeSupplies();
    setupHomeSuppliesForm();
});

// ====== RENDERIZAÇÃO DOS MINI-CARDS ======
function renderHomeSupplies() {
    const container = document.getElementById('supplies-home');
    if (!container) return;

    const inventory = JSON.parse(localStorage.getItem('hub_inventory')) || [];
    const activeItems = inventory.filter(item => item.status === 'in-stock' || item.status === 'opened');

    if (activeItems.length === 0) {
        container.innerHTML = '<p class="empty-supplies-msg" style="margin-top: 1rem;">Nenhum suprimento aberto ou em estoque no momento.</p>';
        return;
    }

    const itemsHTML = activeItems.map(item => {
        const isOpened = item.status === 'opened';
        const statusClass = isOpened ? 'mini-status-opened' : 'mini-status-stock';
        const statusText = isOpened ? 'Aberto' : 'Em Estoque';
        
        return `
            <div class="mini-supply-card ${statusClass}" title="${item.name} | ${item.brand}">
                <div class="mini-supply-img" style="background-image: url('${item.url}')"></div>
                <div class="mini-supply-info">
                    <p class="mini-supply-name">${item.name}</p>
                    <span class="mini-supply-tag">${statusText}</span>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `<div class="supplies-home-grid" style="margin-top: 1rem;">${itemsHTML}</div>`;
}

// ====== LÓGICA DO FORMULÁRIO ======
function setupHomeSuppliesForm() {
    const btnToggleHome = document.getElementById('btn-toggle-home-supplies');
    const formContainer = document.getElementById('home-supplies-form-container');
    const homeForm = document.getElementById('home-supplies-form');

    if (!btnToggleHome || !formContainer || !homeForm) return;

    // Abrir/Fechar formulário
    btnToggleHome.addEventListener('click', () => {
        formContainer.classList.toggle('show');
        btnToggleHome.innerText = formContainer.classList.contains('show') ? '- Fechar' : '+ Add';
    });

    // Enviar formulário e salvar no LocalStorage
    homeForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        let inventory = JSON.parse(localStorage.getItem('hub_inventory')) || [];
        const isOpenedToday = document.getElementById('h-aceitar').checked;
        const todayStr = new Date().toISOString().split('T')[0];

        const newItem = {
            id: Date.now().toString(),
            name: document.getElementById('h-supplies').value,
            brand: document.getElementById('h-brand').value,
            url: document.getElementById('h-url').value,
            qnt: document.getElementById('h-qnt').value,
            tag: document.getElementById('h-tag').value,
            status: isOpenedToday ? 'opened' : 'in-stock',
            dateAdded: todayStr,
            dateOpened: isOpenedToday ? todayStr : null,
            dateEnded: null
        };

        inventory.push(newItem);
        localStorage.setItem('hub_inventory', JSON.stringify(inventory));
        
        // Limpa o form, esconde e atualiza a lista
        this.reset();
        formContainer.classList.remove('show');
        btnToggleHome.innerText = '+ Add';
        renderHomeSupplies();
    });
}