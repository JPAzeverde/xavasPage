// ============================================================
// LOGISTICS & INVENTORY: FIREBASE CORE LOGIC
// ============================================================
import { db, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from '../core/firebase-config.js';

let inventory = [];
let currentItemContext = null; 

// --- PREDICTIVE MATRIX ---
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

// --- RENDER ENGINE ---
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
        card.className = `supply-card supply-card--${item.status}`;
        card.style.backgroundImage = `url('${item.url}')`;
        card.addEventListener('click', () => openModal(item.id));

        let forecastHTML = '';
        if (item.status === 'opened') {
            const avgDays = calculateAverageLifespan(item.name);
            if (avgDays) {
                const forecastDate = formatForecastDate(item.dateOpened, avgDays);
                forecastHTML = `<div class="supply-card__badge badge--predict">DEPLETION: ${forecastDate}</div>`;
            } else {
                forecastHTML = `<div class="supply-card__badge badge--unknown">NO DATA</div>`;
            }
        }

        card.innerHTML = `
            ${forecastHTML}
            <div class="supply-card__info">
                <p class="supply-card__title">${item.name}</p>
                <p class="supply-card__meta">${item.brand} | ${item.qnt}</p>
            </div>
        `;

        if (DOM.grids[item.status]) {
            DOM.grids[item.status].appendChild(card);
        }
    });
};

// --- INJECTION MODAL (NEW ITEM) ---
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

formSupply.addEventListener('submit', async (e) => {
    e.preventDefault();

    const isOpenedToday = document.getElementById('input-opened').checked;
    const todayStr = new Date().toISOString().split('T')[0];

    const newItem = {
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

    try {
        await addDoc(collection(db, "hub_inventory"), newItem);
        closeSupplyModal();
        formSupply.reset();
    } catch (error) {
        console.error("SYS.ERR: Supply injection failed.", error);
    }
});

// --- STATUS UPDATE MODAL ---
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
        modal.title.innerText = "Deploy Asset";
        modal.desc.innerText = `Initialize deployment of '${item.name}'?`;
        modal.dateLabel.innerText = "Deployment Date:";
    } else if (item.status === 'opened') {
        modal.title.innerText = "Terminate Asset";
        modal.desc.innerText = `Confirm depletion of '${item.name}'?`;
        modal.dateLabel.innerText = "Depletion Date:";
    } else if (item.status === 'ended') {
        modal.title.innerText = "Asset Archived";
        modal.desc.innerText = `This asset is depleted. Do you want to scrub it from the database?`;
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

modal.btnConfirm.addEventListener('click', async () => {
    if (!currentItemContext || !modal.dateInput.value) return;

    let updateData = {};

    if (currentItemContext.status === 'in-stock') {
        updateData = { status: 'opened', dateOpened: modal.dateInput.value };
    } else if (currentItemContext.status === 'opened') {
        updateData = { status: 'ended', dateEnded: modal.dateInput.value };
    }

    try {
        await updateDoc(doc(db, "hub_inventory", currentItemContext.id), updateData);
        closeModal();
    } catch (error) {
        console.error("SYS.ERR: Status update failed.", error);
    }
});

modal.btnDelete.addEventListener('click', async () => {
    if (!currentItemContext) return;
    
    if (confirm(`SYS.WARN: Permanently scrub "${currentItemContext.name}" from database?`)) {
        try {
            await deleteDoc(doc(db, "hub_inventory", currentItemContext.id));
            closeModal();
        } catch (error) {
            console.error("SYS.ERR: Scrub failed.", error);
        }
    }
});

// --- FIREBASE INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    onSnapshot(collection(db, "hub_inventory"), (snapshot) => {
        inventory = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderInventory();
    });
});