// ====== ESTADO E LOCALSTORAGE ======
let inventory = JSON.parse(localStorage.getItem('hub_inventory')) || [];
let currentItemContext = null; 

// ====== INJEÇÃO DE CSS ======
function injectNewForecastStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        .forecast-status {
            font-size: 10px;
            margin-top: 2px;
            font-weight: bold;
            text-align: center;
            line-height: 1;
            display: block;
        }
        .forecast-available { color: var(--color-yellow); }
        .forecast-not-available { color: var(--txt-light-grey); }
    `;
    document.head.appendChild(style);
}
injectNewForecastStyles();


// ====== TRANSIÇÃO DO FORMULÁRIO ======
const btnToggleForm = document.getElementById('btn-toggle-logistic-form');
const formSection = document.getElementById('supplies-form-section');

btnToggleForm.addEventListener('click', () => {
    formSection.classList.toggle('show');
    btnToggleForm.innerText = formSection.classList.contains('show') ? '- Fechar' : '+ Item';
});

// ====== FUNÇÕES PREDITIVAS ======
function calculateAverageLifespan(itemName) {
    const historicalItems = inventory.filter(item => 
        item.name.toLowerCase() === itemName.toLowerCase() && 
        item.status === 'ended' && 
        item.dateOpened && 
        item.dateEnded
    );

    if (historicalItems.length === 0) return null;

    let totalDays = 0;
    historicalItems.forEach(item => {
        const opened = new Date(item.dateOpened);
        const ended = new Date(item.dateEnded);
        const diffTime = Math.abs(ended - opened);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalDays += diffDays;
    });

    return Math.round(totalDays / historicalItems.length);
}

function formatForecastDate(dateOpenedString, daysToAdd) {
    const date = new Date(dateOpenedString);
    date.setDate(date.getDate() + daysToAdd);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
}

// ====== RENDERIZAÇÃO DA UI ======
function renderInventory() {
    const inStockDiv = document.getElementById('in-stock');
    const openedDiv = document.getElementById('opened');
    const endedDiv = document.getElementById('ended');

    inStockDiv.innerHTML = ''; openedDiv.innerHTML = ''; endedDiv.innerHTML = '';

    inventory.forEach(item => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.backgroundImage = `url('${item.url}')`;
        card.onclick = () => openModal(item.id);

        let forecastHTML = '';
        
        if (item.status === 'opened') {
            const avgDays = calculateAverageLifespan(item.name);
            if (avgDays) {
                const forecastDate = formatForecastDate(item.dateOpened, avgDays);
                forecastHTML = `<p class="forecast-status forecast-available">previsao de acabar em: ${forecastDate}</p>`;
            } else {
                forecastHTML = `<p class="forecast-status forecast-not-available">Sem Previsão</p>`;
            }
        }

        card.innerHTML = `
            <div class="product-info">
                <p><strong>${item.name}</strong></p>
                <p class="brand">${item.brand} | ${item.qnt}</p>
                ${forecastHTML}
            </div>
        `;

        if (item.status === 'in-stock') inStockDiv.appendChild(card);
        else if (item.status === 'opened') openedDiv.appendChild(card);
        else endedDiv.appendChild(card);
    });
}

// ====== ADICIONAR NOVO ITEM ======
document.getElementById('supplies-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const isOpenedToday = document.getElementById('aceitar').checked;
    const todayStr = new Date().toISOString().split('T')[0];

    const newItem = {
        id: Date.now().toString(),
        name: document.getElementById('supplies').value,
        brand: document.getElementById('brand').value,
        url: document.getElementById('url').value,
        qnt: document.getElementById('qnt').value,
        tag: document.getElementById('tag').value,
        status: isOpenedToday ? 'opened' : 'in-stock',
        dateAdded: todayStr,
        dateOpened: isOpenedToday ? todayStr : null,
        dateEnded: null
    };

    inventory.push(newItem);
    localStorage.setItem('hub_inventory', JSON.stringify(inventory));
    
    this.reset();
    formSection.classList.remove('show');
    btnToggleForm.innerText = '+ Item';
    renderInventory();
});

// ====== LÓGICA DO MODAL ======
const modal = document.getElementById('product-modal');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-desc');
const modalDate = document.getElementById('modal-date');
const modalDateLabel = document.getElementById('modal-date-label');
const modalDateGroup = document.getElementById('modal-date-group');
const modalBtnConfirm = document.getElementById('modal-btn-confirm');

function openModal(id) {
    const item = inventory.find(i => i.id === id);
    if (!item) return; // Agora permite abrir itens "ended"

    currentItemContext = item;
    modalDate.value = new Date().toISOString().split('T')[0];

    // Reseta visualização padrão dos botões
    modalDateGroup.style.display = 'flex';
    modalBtnConfirm.style.display = 'block';

    if (item.status === 'in-stock') {
        modalTitle.innerText = "Abrir Produto";
        modalDesc.innerText = `Deseja marcar '${item.name}' como aberto em uso?`;
        modalDateLabel.innerText = "Data de Abertura:";
    } else if (item.status === 'opened') {
        modalTitle.innerText = "Finalizar Produto";
        modalDesc.innerText = `O produto '${item.name}' acabou?`;
        modalDateLabel.innerText = "Data do Término:";
    } else if (item.status === 'ended') {
        modalTitle.innerText = "Produto Finalizado";
        modalDesc.innerText = `Este produto já foi finalizado. Deseja excluí-lo do histórico?`;
        // Esconde input de data e botão de salvar para itens finalizados
        modalDateGroup.style.display = 'none';
        modalBtnConfirm.style.display = 'none';
    }

    modal.classList.replace('modal-hidden', 'modal-visible');
}

// Ação: Fechar Modal
document.getElementById('modal-btn-close').addEventListener('click', () => {
    modal.classList.replace('modal-visible', 'modal-hidden');
    currentItemContext = null;
});

// Ação: Salvar/Atualizar Produto
document.getElementById('modal-btn-confirm').addEventListener('click', () => {
    if (!currentItemContext || !modalDate.value) return;

    if (currentItemContext.status === 'in-stock') {
        currentItemContext.status = 'opened';
        currentItemContext.dateOpened = modalDate.value;
    } else if (currentItemContext.status === 'opened') {
        currentItemContext.status = 'ended';
        currentItemContext.dateEnded = modalDate.value;
    }

    localStorage.setItem('hub_inventory', JSON.stringify(inventory));
    modal.classList.replace('modal-visible', 'modal-hidden');
    currentItemContext = null;
    renderInventory();
});

// Ação: Excluir Produto
document.getElementById('modal-btn-delete').addEventListener('click', () => {
    if (!currentItemContext) return;

    // Confirmação nativa do navegador para evitar acidentes
    const isConfirmed = confirm(`Tem certeza que deseja excluir "${currentItemContext.name}" permanentemente?`);
    
    if (isConfirmed) {
        // Filtra o array mantendo apenas os itens com ID diferente do atual
        inventory = inventory.filter(i => i.id !== currentItemContext.id);
        
        // Atualiza o local storage e a interface
        localStorage.setItem('hub_inventory', JSON.stringify(inventory));
        modal.classList.replace('modal-visible', 'modal-hidden');
        currentItemContext = null;
        renderInventory();
    }
});

// Ação de Logout (mantida do seu código original)
document.getElementById('btn-logout').addEventListener('click', function() {
    sessionStorage.removeItem('portal_pessoal_auth');
    window.location.replace('pages/login.html');
});

// ====== INIT ======
renderInventory();