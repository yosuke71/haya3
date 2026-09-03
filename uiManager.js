// 画面描画・DOM構築を担当する。ゲームロジックは持たず、gameState の変化を購読して反映する。
// 皿・口の当たり判定用ジオメトリはここで一元管理する（数値は style.css の同要素と一致させること）。

import { FOOD_ITEMS, FoodCategory, CHILD_IMAGES, getFoodById, getFoodImagePath } from './foodData.js';
import { gameState, GameStatus } from './gameState.js';

export const LAYOUT = {
    boardWidth: 1920,
    boardHeight: 1200,
    plate: { centerX: 960, centerY: 860, radiusX: 333, radiusY: 188 },
    mouth: { centerX: 968, centerY: 428, hitRx: 95, hitRy: 65 },
};

const EAT_ANIMATION_DURATION = 400; // ms

let boardEl;
let listLeftEl;
let listRightEl;
let plateItemsLayerEl;
let childFaceImgEl;
let childFaceContainerEl;
let readyButtonEl;
let restartButtonEl;
let finishedOverlayEl;
let startOverlayEl;
let startButtonEl;
let backToStartButtonEl;

const plateItemElements = new Map(); // uid -> element

function createFoodIconElement(foodItem) {
    const icon = document.createElement('div');
    icon.className = 'food-icon';

    const img = document.createElement('img');
    img.src = getFoodImagePath(foodItem);
    img.alt = foodItem.name;
    img.draggable = false;
    img.addEventListener('error', () => {
        icon.classList.add('food-icon--fallback');
        icon.textContent = foodItem.name.charAt(0);
        img.remove();
    });

    icon.appendChild(img);
    return icon;
}

function createListItemElement(foodItem) {
    const item = document.createElement('div');
    item.className = 'food-list-item';
    item.dataset.foodId = foodItem.id;
    item.appendChild(createFoodIconElement(foodItem));

    const label = document.createElement('span');
    label.className = 'food-label';
    label.textContent = foodItem.name;
    item.appendChild(label);

    return item;
}

function renderFoodLists(onListItemReady) {
    FOOD_ITEMS.forEach((foodItem) => {
        const el = createListItemElement(foodItem);
        if (foodItem.category === FoodCategory.MEAL) {
            listLeftEl.appendChild(el);
        } else {
            listRightEl.appendChild(el);
        }
        onListItemReady(el, foodItem.id);
    });
}

function positionPlateItemElement(el, item) {
    el.style.left = `${item.x}px`;
    el.style.top = `${item.y}px`;
    el.style.zIndex = String(item.zIndex);
}

function handlePlateAdd(item, onPlateItemReady) {
    const foodItem = getFoodById(item.foodId);
    const el = document.createElement('div');
    el.className = 'plate-item';
    el.dataset.uid = item.uid;
    el.appendChild(createFoodIconElement(foodItem));
    positionPlateItemElement(el, item);
    plateItemsLayerEl.appendChild(el);
    plateItemElements.set(item.uid, el);
    onPlateItemReady(el, item.uid);
}

function handlePlateMove(item) {
    const el = plateItemElements.get(item.uid);
    if (!el) return;
    positionPlateItemElement(el, item);
}

function handlePlateRemove(item) {
    const el = plateItemElements.get(item.uid);
    if (!el) return;
    el.remove();
    plateItemElements.delete(item.uid);
}

// PREPARING中のみ、皿に食べ物が1つも無ければ「はいどうぞ」を押せなくする
function updateReadyButtonAvailability() {
    if (gameState.getStatus() !== GameStatus.PREPARING) return;
    readyButtonEl.disabled = gameState.getPlateItems().length === 0;
}

function handleStatusChange(status) {
    if (status === GameStatus.EATING) {
        listLeftEl.classList.add('is-disabled');
        listRightEl.classList.add('is-disabled');
        readyButtonEl.disabled = true;
        setChildMouthOpen(false);
    } else if (status === GameStatus.FINISHED) {
        finishedOverlayEl.classList.add('is-visible');
    } else if (status === GameStatus.PREPARING) {
        listLeftEl.classList.remove('is-disabled');
        listRightEl.classList.remove('is-disabled');
        finishedOverlayEl.classList.remove('is-visible');
        setChildWaiting();
        updateReadyButtonAvailability();
    }
}

export function initUI({ onListItemReady, onPlateItemReady }) {
    boardEl = document.getElementById('game-board');
    listLeftEl = document.getElementById('list-left');
    listRightEl = document.getElementById('list-right');
    plateItemsLayerEl = document.getElementById('plate-items-layer');
    childFaceContainerEl = document.getElementById('child-face');
    childFaceImgEl = document.getElementById('child-face-img');
    readyButtonEl = document.getElementById('ready-button');
    restartButtonEl = document.getElementById('restart-button');
    finishedOverlayEl = document.getElementById('finished-overlay');
    startOverlayEl = document.getElementById('start-overlay');
    startButtonEl = document.getElementById('start-button');
    backToStartButtonEl = document.getElementById('back-to-start-button');

    childFaceImgEl.addEventListener('error', () => {
        childFaceContainerEl.classList.add('child-face--fallback');
    });
    setChildWaiting();

    renderFoodLists(onListItemReady);

    gameState.addEventListener('plate-add', (e) => {
        handlePlateAdd(e.detail, onPlateItemReady);
        updateReadyButtonAvailability();
    });
    gameState.addEventListener('plate-move', (e) => handlePlateMove(e.detail));
    gameState.addEventListener('plate-remove', (e) => {
        handlePlateRemove(e.detail);
        updateReadyButtonAvailability();
    });
    gameState.addEventListener('status-change', (e) => handleStatusChange(e.detail.status));

    updateReadyButtonAvailability();

    applyScale();
    window.addEventListener('resize', applyScale);
}

export function applyScale() {
    const scale = Math.min(
        window.innerWidth / LAYOUT.boardWidth,
        window.innerHeight / LAYOUT.boardHeight
    );
    boardEl.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

// クライアント座標（画面上のピクセル）を盤面座標（1920x1200基準）へ変換する
export function toBoardCoords(clientX, clientY) {
    const rect = boardEl.getBoundingClientRect();
    return {
        x: ((clientX - rect.left) / rect.width) * LAYOUT.boardWidth,
        y: ((clientY - rect.top) / rect.height) * LAYOUT.boardHeight,
    };
}

export function isPointInsidePlate(x, y) {
    const { centerX, centerY, radiusX, radiusY } = LAYOUT.plate;
    const dx = (x - centerX) / radiusX;
    const dy = (y - centerY) / radiusY;
    return dx * dx + dy * dy <= 1;
}

export function isPointInsideMouth(x, y) {
    const { centerX, centerY, hitRx, hitRy } = LAYOUT.mouth;
    const dx = (x - centerX) / hitRx;
    const dy = (y - centerY) / hitRy;
    return dx * dx + dy * dy <= 1;
}

export function getPlateItemElement(uid) {
    return plateItemElements.get(uid) || null;
}

export function setChildMouthOpen(isOpen) {
    childFaceImgEl.src = isOpen ? CHILD_IMAGES.mouthOpen : CHILD_IMAGES.mouthClosed;
    childFaceImgEl.alt = isOpen ? 'こども（もぐもぐ）' : 'こども';
    childFaceContainerEl.classList.toggle('mouth-open', isOpen);
}

export function setChildWaiting() {
    childFaceImgEl.src = CHILD_IMAGES.waiting;
    childFaceImgEl.alt = 'こども（まちどおしい）';
    childFaceContainerEl.classList.remove('mouth-open');
}

export function setChildItadakimasu() {
    childFaceImgEl.src = CHILD_IMAGES.itadakimasu;
    childFaceImgEl.alt = 'こども（いただきます）';
    childFaceContainerEl.classList.remove('mouth-open');
}

// 「はいどうぞ」直後、いただきます演出中に一覧・ボタン操作を先んじて封じる
export function lockForServing() {
    listLeftEl.classList.add('is-disabled');
    listRightEl.classList.add('is-disabled');
    readyButtonEl.disabled = true;
}

export function playEatAnimation(uid) {
    const el = plateItemElements.get(uid);
    if (!el) return Promise.resolve();
    el.classList.add('is-being-eaten');
    return new Promise((resolve) => {
        setTimeout(resolve, EAT_ANIMATION_DURATION);
    });
}

export function getReadyButtonElement() {
    return readyButtonEl;
}

export function getRestartButtonElement() {
    return restartButtonEl;
}

export function getStartButtonElement() {
    return startButtonEl;
}

export function hideStartOverlay() {
    startOverlayEl.classList.remove('is-visible');
}

export function showStartOverlay() {
    startOverlayEl.classList.add('is-visible');
}

export function getBackToStartButtonElement() {
    return backToStartButtonEl;
}
