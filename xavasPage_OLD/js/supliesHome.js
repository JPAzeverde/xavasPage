document.addEventListener('DOMContentLoaded', () => {
    renderHomeSupplies();
    setupHomeSuppliesForm();
});

// ====== RENDERIZAÇÃO DOS MINI-CARDS ======
function renderHomeSupplies() {
    const container = document.getElementById('supplies-home');
    if (!container) return;

    const inventory = JSON.parse(localStorage.getItem('hub_inventory')) || [];
    
    // Separa os itens em duas listas
    const stockItems = inventory.filter(item => item.status === 'in-stock');
    const openedItems = inventory.filter(item => item.status === 'opened');

    if (stockItems.length === 0 && openedItems.length === 0) {
        container.innerHTML = '<p class="empty-supplies-msg" style="margin-top: 1rem;">Nenhum suprimento aberto ou em estoque no momento.</p>';
        return;
    }

    // Função auxiliar para montar o HTML de cada card com seu respectivo botão
    const createCardHTML = (item, isOpened) => {
        const statusClass = isOpened ? 'mini-status-opened' : 'mini-status-stock';
        const statusText = isOpened ? 'Aberto' : 'Em Estoque';
        
        // Botão que aparece no hover
        const actionButton = isOpened 
            ? `<button class="mini-supply-action-btn btn-finish" onclick="finishSupplyToday('${item.id}')">Finalizar Hoje</button>`
            : `<button class="mini-supply-action-btn btn-open" onclick="openSupplyToday('${item.id}')">Abrir Hoje</button>`;
        
        return `
            <div class="mini-supply-card ${statusClass}" title="${item.name} | ${item.brand}">
                <div class="mini-supply-img" style="background-image: url('${item.url}')"></div>
                <div class="mini-supply-info">
                    <p class="mini-supply-name">${item.name}</p>
                    <span class="mini-supply-tag">${statusText}</span>
                </div>
                <div class="mini-supply-action-overlay">
                    ${actionButton}
                </div>
            </div>
        `;
    };

    // Gera o HTML das colunas
    const openedHTML = openedItems.length > 0 
        ? openedItems.map(item => createCardHTML(item, true)).join('') 
        : '<p class="empty-supplies-msg">Sem itens em uso.</p>';

    const stockHTML = stockItems.length > 0 
        ? stockItems.map(item => createCardHTML(item, false)).join('') 
        : '<p class="empty-supplies-msg">Sem itens em estoque.</p>';

    // Renderiza as duas colunas
    container.innerHTML = `
        <div class="supplies-home-columns" style="margin-top: 1rem;">
            <div class="supplies-column">
                <h4 class="column-title">Em Uso</h4>
                <div class="supplies-home-grid">${openedHTML}</div>
            </div>
            <div class="supplies-column">
                <h4 class="column-title">Em Estoque</h4>
                <div class="supplies-home-grid">${stockHTML}</div>
            </div>
        </div>
    `;
}

// ====== AÇÕES RÁPIDAS DOS BOTÕES ======
// Usa window. para garantir que o onclick no HTML consiga acessar as funções
window.openSupplyToday = function(id) {
    let inventory = JSON.parse(localStorage.getItem('hub_inventory')) || [];
    const todayStr = new Date().toISOString().split('T')[0];
    
    inventory = inventory.map(item => {
        if (item.id === id) {
            item.status = 'opened';
            item.dateOpened = todayStr;
        }
        return item;
    });

    localStorage.setItem('hub_inventory', JSON.stringify(inventory));
    renderHomeSupplies(); // Re-renderiza a home
};

window.finishSupplyToday = function(id) {
    let inventory = JSON.parse(localStorage.getItem('hub_inventory')) || [];
    const todayStr = new Date().toISOString().split('T')[0];
    
    inventory = inventory.map(item => {
        if (item.id === id) {
            item.status = 'ended';
            item.dateEnded = todayStr;
        }
        return item;
    });

    localStorage.setItem('hub_inventory', JSON.stringify(inventory));
    renderHomeSupplies(); // Re-renderiza a home
};

// ====== LÓGICA DO FORMULÁRIO ======
function setupHomeSuppliesForm() {
    const btnToggleHome = document.getElementById('btn-toggle-home-supplies');
    const formContainer = document.getElementById('home-supplies-form-container');
    const homeForm = document.getElementById('home-supplies-form');

    if (!btnToggleHome || !formContainer || !homeForm) return;

    // Abrir/Fechar formulário
    btnToggleHome.addEventListener('click', () => {
        formContainer.classList.toggle('show');
        btnToggleHome.innerText = formContainer.classList.contains('show') ? 'x' : '+ Add';
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