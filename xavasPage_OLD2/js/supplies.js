// =========================================
// HEADER LOGIC
// =========================================
const btnMenu = document.getElementById('btn-menu');
const mainNav = document.getElementById('main-nav');
const btnLogout = document.getElementById('btn-logout');

btnMenu?.addEventListener('click', () => {
    mainNav.classList.toggle('is-open');
    btnMenu.textContent = mainNav.classList.contains('is-open') ? 'Close' : 'Menu';
});

btnLogout?.addEventListener('click', () => {
    sessionStorage.removeItem('portal_pessoal_auth');
    window.location.replace('login.html');
});

// =========================================
// STATE & STORAGE
// =========================================
let inventory = JSON.parse(localStorage.getItem('hub_inventory')) || [];
let currentItemContext = null; 

const saveInventory = () => {
    localStorage.setItem('hub_inventory', JSON.stringify(inventory));
    renderInventory();
};

// =========================================
// PREDICTIVE LOGIC
// =========================================
const calculateAverageLifespan = (itemName) => {
    const historicalItems = inventory.filter(item => 
        item.name.toLowerCase() === itemName.toLowerCase() && 
        item.status === 'ended' && 
        item.dateOpened && 
        item.dateEnded
    );

    if (historicalItems.length === 0) return null;

    const totalDays = historicalItems.reduce((acc, item) => {
        const opened = new Date(item.dateOpened);
        const ended = new Date(item.dateEnded);
        const diffDays = Math.ceil(Math.abs(ended - opened) / (1000 * 60 * 60 * 24));
        return acc + diffDays;
    }, 0);

    return Math.round(totalDays / historicalItems.length);
};

const formatForecastDate = (dateOpenedString, daysToAdd) => {
    const date = new Date(dateOpenedString);
    date.setDate(date.getDate() + daysToAdd);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
};

// =========================================
// RENDER UI
// =========================================
const DOM = {
    grids: {
        'in-stock': document.getElementById('grid-stock'),
        'opened': document.getElementById('grid-opened'),
        'ended': document.getElementById('grid-ended')
    }
};

const renderInventory = () => {
    Object.values(DOM.grids).forEach(grid => grid.innerHTML = '');

    inventory.forEach(item => {
        const card = document.createElement('div');
        card.className = `product-card product-card--${item.status}`;
        card.style.backgroundImage = `url('${item.url}')`;
        card.addEventListener('click', () => openModal(item.id));

        let forecastHTML = '';
        if (item.status === 'opened') {
            const avgDays = calculateAverageLifespan(item.name);
            if (avgDays) {
                const forecastDate = formatForecastDate(item.dateOpened, avgDays);
                forecastHTML = `<div class="product-card__forecast forecast--available">Ends: ${forecastDate}</div>`;
            } else {
                forecastHTML = `<div class="product-card__forecast forecast--unavailable">No Data</div>`;
            }
        }

        card.innerHTML = `
            ${forecastHTML}
            <div class="product-card__info">
                <p class="product-card__title">${item.name}</p>
                <p class="product-card__brand">${item.brand} | ${item.qnt}</p>
            </div>
        `;

        if (DOM.grids[item.status]) {
            DOM.grids[item.status].appendChild(card);
        }
    });
};

// =========================================
// FORM LOGIC (Modal)
// =========================================
const btnToggleForm = document.getElementById('btn-toggle-form');
const modalSupplyForm = document.getElementById('modal-supply-form');
const formSupply = document.getElementById('form-supply');
const btnCloseSupply = document.getElementById('btn-close-supply-modal');

const openSupplyModal = () => modalSupplyForm.classList.remove('modal--hidden');
const closeSupplyModal = () => modalSupplyForm.classList.add('modal--hidden');

btnToggleForm.addEventListener('click', openSupplyModal);
btnCloseSupply.addEventListener('click', closeSupplyModal);
modalSupplyForm.addEventListener('mousedown', (e) => {
    if (e.target === modalSupplyForm) closeSupplyModal();
});

formSupply.addEventListener('submit', (e) => {
    e.preventDefault();

    const isOpenedToday = document.getElementById('input-opened').checked;
    const todayStr = new Date().toISOString().split('T')[0];

    const newItem = {
        id: Date.now().toString(),
        name: document.getElementById('input-name').value.trim(),
        brand: document.getElementById('input-brand').value.trim(),
        url: document.getElementById('input-url').value.trim(),
        qnt: document.getElementById('input-qnt').value.trim(),
        tag: document.getElementById('input-tag').value,
        status: isOpenedToday ? 'opened' : 'in-stock',
        dateAdded: todayStr,
        dateOpened: isOpenedToday ? todayStr : null,
        dateEnded: null
    };

    inventory.push(newItem);
    saveInventory();
    
    closeSupplyModal();
    formSupply.reset();
});

// =========================================
// MODAL LOGIC
// =========================================
const modal = {
    overlay: document.getElementById('modal-product'),
    title: document.getElementById('modal-title'),
    desc: document.getElementById('modal-desc'),
    dateGroup: document.getElementById('modal-date-group'),
    dateLabel: document.getElementById('modal-date-label'),
    dateInput: document.getElementById('modal-date'),
    btnConfirm: document.getElementById('modal-btn-confirm'),
    btnClose: document.getElementById('modal-btn-close'),
    btnDelete: document.getElementById('modal-btn-delete')
};

const openModal = (id) => {
    const item = inventory.find(i => i.id === id);
    if (!item) return;

    currentItemContext = item;
    modal.dateInput.value = new Date().toISOString().split('T')[0];
    modal.dateGroup.style.display = 'flex';
    modal.btnConfirm.style.display = 'block';

    if (item.status === 'in-stock') {
        modal.title.innerText = "Open Product";
        modal.desc.innerText = `Mark '${item.name}' as currently in use?`;
        modal.dateLabel.innerText = "Date Opened:";
    } else if (item.status === 'opened') {
        modal.title.innerText = "Finish Product";
        modal.desc.innerText = `Is '${item.name}' completely empty/ended?`;
        modal.dateLabel.innerText = "Date Ended:";
    } else if (item.status === 'ended') {
        modal.title.innerText = "Product Ended";
        modal.desc.innerText = `This product is already finished. Do you want to delete it from history?`;
        modal.dateGroup.style.display = 'none';
        modal.btnConfirm.style.display = 'none';
    }

    modal.overlay.classList.remove('modal--hidden');
};

const closeModal = () => {
    modal.overlay.classList.add('modal--hidden');
    currentItemContext = null;
};

modal.btnClose.addEventListener('click', closeModal);
modal.overlay.addEventListener('mousedown', (e) => {
    if (e.target === modal.overlay) closeModal();
});

modal.btnConfirm.addEventListener('click', () => {
    if (!currentItemContext || !modal.dateInput.value) return;

    if (currentItemContext.status === 'in-stock') {
        currentItemContext.status = 'opened';
        currentItemContext.dateOpened = modal.dateInput.value;
    } else if (currentItemContext.status === 'opened') {
        currentItemContext.status = 'ended';
        currentItemContext.dateEnded = modal.dateInput.value;
    }

    saveInventory();
    closeModal();
});

modal.btnDelete.addEventListener('click', () => {
    if (!currentItemContext) return;
    
    if (confirm(`Are you sure you want to permanently delete "${currentItemContext.name}"?`)) {
        inventory = inventory.filter(i => i.id !== currentItemContext.id);
        saveInventory();
        closeModal();
    }
});

// =========================================
// INIT
// =========================================
document.addEventListener('DOMContentLoaded', renderInventory);