// ゲーム状態管理（PREPARING / EATING / FINISHED）と皿の上の食べ物データを保持する。
// DOM操作は一切行わない。状態変化は CustomEvent で通知し、uiManager 側が購読して描画する。

export const GameStatus = Object.freeze({
    PREPARING: 'PREPARING',
    EATING: 'EATING',
    FINISHED: 'FINISHED',
});

class GameState extends EventTarget {
    constructor() {
        super();
        this.status = GameStatus.PREPARING;
        this.plateItems = [];
        this._uidCounter = 0;
        this._zIndexCounter = 0;
    }

    getStatus() {
        return this.status;
    }

    getPlateItems() {
        return this.plateItems;
    }

    getPlateItem(uid) {
        return this.plateItems.find((item) => item.uid === uid) || null;
    }

    // 一覧から皿へ新しい食べ物を配置する（PREPARING中のみ）
    addPlateItem(foodId, x, y) {
        if (this.status !== GameStatus.PREPARING) return null;
        const item = {
            uid: `item-${++this._uidCounter}`,
            foodId,
            x,
            y,
            zIndex: ++this._zIndexCounter,
        };
        this.plateItems.push(item);
        this.dispatchEvent(new CustomEvent('plate-add', { detail: item }));
        return item;
    }

    // 皿の上の食べ物を移動する
    movePlateItem(uid, x, y) {
        const item = this.getPlateItem(uid);
        if (!item) return;
        item.x = x;
        item.y = y;
        item.zIndex = ++this._zIndexCounter;
        this.dispatchEvent(new CustomEvent('plate-move', { detail: item }));
    }

    // ドラッグ開始時に最前面へ表示する
    bringToFront(uid) {
        const item = this.getPlateItem(uid);
        if (!item) return;
        item.zIndex = ++this._zIndexCounter;
        this.dispatchEvent(new CustomEvent('plate-move', { detail: item }));
    }

    // 皿の外に出された、または食べ終わった食べ物を削除する
    removePlateItem(uid) {
        const index = this.plateItems.findIndex((item) => item.uid === uid);
        if (index === -1) return null;
        const [item] = this.plateItems.splice(index, 1);
        this.dispatchEvent(new CustomEvent('plate-remove', { detail: item }));
        return item;
    }

    // 「はいどうぞ」ボタン押下
    startEating() {
        if (this.status !== GameStatus.PREPARING) return;
        this._setStatus(GameStatus.EATING);
        if (this.plateItems.length === 0) {
            this.finish();
        }
    }

    // 皿が空になったら呼ばれる（内部状態）
    finish() {
        if (this.status === GameStatus.FINISHED) return;
        this._setStatus(GameStatus.FINISHED);
    }

    // 「もういちど あそぶ」「さいしょに もどる」で最初の状態に戻す
    reset() {
        [...this.plateItems].forEach((item) => this.removePlateItem(item.uid));
        this._setStatus(GameStatus.PREPARING);
    }

    _setStatus(status) {
        this.status = status;
        this.dispatchEvent(new CustomEvent('status-change', { detail: { status } }));
    }
}

export const gameState = new GameState();
