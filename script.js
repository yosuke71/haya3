// エントリーポイント。各モジュールを結線し、状態変化に応じた演出（音・口の開閉）をまとめる。

import { gameState, GameStatus } from './gameState.js';
import * as uiManager from './uiManager.js';
import * as dragManager from './dragManager.js';
import * as soundManager from './soundManager.js';

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
        soundManager.playStart();
        gameState.startEating();
    });

    uiManager.getRestartButtonElement().addEventListener('click', () => {
        soundManager.playButton();
        gameState.reset();
    });
}

document.addEventListener('DOMContentLoaded', init);
