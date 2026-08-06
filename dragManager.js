// Pointer Events によるドラッグ処理。マルチタッチ（複数指の同時操作）に対応するため
// pointerId ごとに独立したセッションを管理する。ゲーム状態やDOM構築には関与せず、
// 判定・配置・移動・削除・給餌の実行は options 経由で呼び出し元（script.js）に委譲する。

import * as soundManager from './soundManager.js';

export const DRAG_OFFSET_X = 0;
export const DRAG_OFFSET_Y = -50; // 指より約50px上へ表示
const ICON_SIZE = 140; // style.css の .food-icon / .plate-item と一致させること

let dragLayerEl;
let opts = null;
const activeSessions = new Map(); // pointerId -> session

function boardCenterFromClient(clientX, clientY) {
    const board = opts.toBoardCoords(clientX, clientY);
    return {
        x: board.x + DRAG_OFFSET_X,
        y: board.y + DRAG_OFFSET_Y,
    };
}

function moveSessionTo(session, clientX, clientY) {
    const { x, y } = boardCenterFromClient(clientX, clientY);
    session.centerX = x;
    session.centerY = y;
    session.element.style.left = `${x - ICON_SIZE / 2}px`;
    session.element.style.top = `${y - ICON_SIZE / 2}px`;
}

function onPointerMove(e) {
    const session = activeSessions.get(e.pointerId);
    if (!session) return;
    moveSessionTo(session, e.clientX, e.clientY);
}

function onPointerUp(e) {
    const session = activeSessions.get(e.pointerId);
    if (!session) return;
    activeSessions.delete(e.pointerId);
    finishSession(session);
}

function finishSession(session) {
    const status = opts.getStatus();
    const { centerX: x, centerY: y } = session;

    if (session.type === 'template') {
        session.element.remove();
        if (status === 'PREPARING' && opts.isPointInsidePlate(x, y)) {
            opts.onPlaceNewItem(session.foodId, x - ICON_SIZE / 2, y - ICON_SIZE / 2);
            soundManager.playDrop();
        }
        return;
    }

    // type === 'plate'
    session.element.classList.remove('dragging');
    session.element.style.zIndex = '';

    if (status === 'EATING') {
        if (opts.isPointInsideMouth(x, y)) {
            opts.onFeedItem(session.uid);
        } else {
            // 口に届かなかった場合は、つまむ前の位置へ戻す
            opts.onMovePlateItem(session.uid, session.originX, session.originY);
            soundManager.playDrop();
        }
    } else if (status === 'PREPARING') {
        if (opts.isPointInsidePlate(x, y)) {
            opts.onMovePlateItem(session.uid, x - ICON_SIZE / 2, y - ICON_SIZE / 2);
            soundManager.playDrop();
        } else {
            opts.onRemovePlateItem(session.uid);
        }
    }
}

export function initDrag(options) {
    opts = options;
    dragLayerEl = document.getElementById('drag-layer');
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
}

// 左右一覧の食べ物アイコン用：つまむと分身（ゴースト）が生まれ、皿の上に置くと新規配置される
export function attachTemplateDrag(listItemEl, foodId) {
    listItemEl.addEventListener('pointerdown', (e) => {
        if (opts.getStatus() !== 'PREPARING') return;
        e.preventDefault();
        soundManager.playPick();

        const sourceIcon = listItemEl.querySelector('.food-icon');
        const ghost = sourceIcon.cloneNode(true);
        ghost.classList.add('food-icon', 'dragging-ghost');
        dragLayerEl.appendChild(ghost);

        const session = { type: 'template', foodId, element: ghost, centerX: 0, centerY: 0 };
        activeSessions.set(e.pointerId, session);
        moveSessionTo(session, e.clientX, e.clientY);
    });
}

// 皿の上の食べ物用：PREPARING中は再配置・皿外で削除、EATING中は口へ運ぶ
export function attachPlateDrag(plateItemEl, uid) {
    plateItemEl.addEventListener('pointerdown', (e) => {
        const status = opts.getStatus();
        if (status !== 'PREPARING' && status !== 'EATING') return;
        e.preventDefault();
        soundManager.playPick();

        opts.onDragStart(uid);
        plateItemEl.classList.add('dragging');
        plateItemEl.style.zIndex = '9999';

        const session = {
            type: 'plate',
            uid,
            element: plateItemEl,
            centerX: 0,
            centerY: 0,
            originX: parseFloat(plateItemEl.style.left),
            originY: parseFloat(plateItemEl.style.top),
        };
        activeSessions.set(e.pointerId, session);
        moveSessionTo(session, e.clientX, e.clientY);
    });
}
