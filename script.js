// エントリーポイント。各モジュールを結線し、状態変化に応じた演出（音・口の開閉）をまとめる。

import { gameState, GameStatus } from './gameState.js';
import * as uiManager from './uiManager.js';
import * as dragManager from './dragManager.js';
import * as soundManager from './soundManager.js';

// 「はいどうぞ」押下：一覧を先に封じ、「いただきます」の画像・音声を最後まで
// 再生してから、実際に食べさせるモード（EATING）へ進む。
async function handleServe() {
    uiManager.lockForServing();
    uiManager.setChildItadakimasu();
    await soundManager.playItadakimasu();
    gameState.startEating();
}

async function handleFeedItem(uid) {
    soundManager.playEat();
    uiManager.setChildMouthOpen(true);

    await uiManager.playEatAnimation(uid);
    gameState.removePlateItem(uid);
    soundManager.playMogu();

    setTimeout(() => {
        uiManager.setChildMouthOpen(false);
        if (gameState.getPlateItems().length === 0) {
            gameState.finish();
        }
    }, 100);
}

function init() {
    uiManager.initUI({
        onListItemReady: (el, foodId) => dragManager.attachTemplateDrag(el, foodId),
        onPlateItemReady: (el, uid) => dragManager.attachPlateDrag(el, uid),
    });

    dragManager.initDrag({
        getStatus: () => gameState.getStatus(),
        toBoardCoords: uiManager.toBoardCoords,
        isPointInsidePlate: uiManager.isPointInsidePlate,
        isPointInsideMouth: uiManager.isPointInsideMouth,
        onPlaceNewItem: (foodId, x, y) => gameState.addPlateItem(foodId, x, y),
        onMovePlateItem: (uid, x, y) => gameState.movePlateItem(uid, x, y),
        onRemovePlateItem: (uid) => gameState.removePlateItem(uid),
        onDragStart: (uid) => gameState.bringToFront(uid),
        onFeedItem: (uid) => handleFeedItem(uid),
    });

    gameState.addEventListener('status-change', (e) => {
        if (e.detail.status === GameStatus.FINISHED) {
            soundManager.playComplete();
        }
    });

    uiManager.getReadyButtonElement().addEventListener('click', () => {
        soundManager.playButton();
        handleServe();
    });

    uiManager.getRestartButtonElement().addEventListener('click', () => {
        soundManager.playButton();
        gameState.reset();
    });

    uiManager.getStartButtonElement().addEventListener('click', () => {
        soundManager.playButton();
        requestFullscreen();
        lockLandscape();
        uiManager.hideStartOverlay();
    });

    uiManager.getBackToStartButtonElement().addEventListener('click', () => {
        soundManager.playButton();
        gameState.reset();
        uiManager.showStartOverlay();
    });

    document.addEventListener('contextmenu', (e) => e.preventDefault());
}

function requestFullscreen() {
    const el = document.documentElement;
    const request = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (!request) return;
    const result = request.call(el);
    if (result && typeof result.catch === 'function') {
        result.catch(() => {});
    }
}

function lockLandscape() {
    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {});
    }
}

document.addEventListener('DOMContentLoaded', init);
