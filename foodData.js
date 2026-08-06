// 食べ物データ定義
// image は assets/images/food/left|right 以下の実ファイル名（用意済み）を参照する。

export const FOOD_IMAGE_DIR = {
    meal: 'assets/images/food/left/',
    dessert: 'assets/images/food/right/',
};

export const CHILD_IMAGE_DIR = 'assets/images/child/';

export const CHILD_IMAGES = {
    mouthClosed: `${CHILD_IMAGE_DIR}child_mouth_closed.png`,
    mouthOpen: `${CHILD_IMAGE_DIR}child_mouth_open.png`,
};

export const FoodCategory = Object.freeze({
    MEAL: 'meal',
    DESSERT: 'dessert',
});

// 左側：ごはん・おかず（3列×6行 = 18種類）
const MEAL_ITEMS = [
    { id: 'gohan', name: 'ごはん', image: '01ごはん.png' },
    { id: 'onigiri', name: 'おにぎり', image: '02おにぎり.png' },
    { id: 'toast', name: 'トースト', image: '03トースト.png' },
    { id: 'korokke', name: 'コロッケ', image: '04コロッケ.png' },
    { id: 'karaage', name: 'からあげ', image: '05からあげ.png' },
    { id: 'gratin', name: 'グラタン', image: '06グラタン.png' },
    { id: 'friedpotato', name: 'フライドポテト', image: '07フライドポテト.png' },
    { id: 'natto', name: 'なっとう', image: '08納豆.png' },
    { id: 'tamagoyaki', name: 'たまごやき', image: '09卵焼き.png' },
    { id: 'hamburg', name: 'ハンバーグ', image: '10ハンバーグ.png' },
    { id: 'okra', name: 'オクラ', image: '11オクラ.png' },
    { id: 'broccoli', name: 'ブロッコリー', image: '12ブロッコリー.png' },
    { id: 'daikon', name: 'だいこん', image: '13大根.png' },
    { id: 'ninjin', name: 'にんじん', image: '14人参.png' },
    { id: 'udon', name: 'うどん', image: '15うどん.png' },
    { id: 'misoshiru', name: 'みそしる', image: '16味噌汁.png' },
    { id: 'mizu', name: 'おみず', image: '17水.png' },
    { id: 'gyunyu', name: 'ぎゅうにゅう', image: '18牛乳.png' },
].map((item) => ({ ...item, category: FoodCategory.MEAL }));

// 右側：デザート・フルーツ（2列×6行 = 12種類）
const DESSERT_ITEMS = [
    { id: 'ringo', name: 'りんご', image: '31りんご.png' },
    { id: 'banana', name: 'バナナ', image: '32バナナ.png' },
    { id: 'ichigo', name: 'いちご', image: '33いちご.png' },
    { id: 'budou', name: 'ぶどう', image: '34ブドウ.png' },
    { id: 'mikan', name: 'みかん', image: '35みかん.png' },
    { id: 'kiwi', name: 'キウイ', image: '36キウイフルーツ.png' },
    { id: 'cookie', name: 'クッキー', image: '37クッキー.png' },
    { id: 'shortcake', name: 'ショートケーキ', image: '38ショートケーキ.png' },
    { id: 'dorayaki', name: 'どらやき', image: '39どら焼き.png' },
    { id: 'purin', name: 'プリン', image: '40プリン.png' },
    { id: 'icecream', name: 'アイスクリーム', image: '41アイスクリーム.png' },
    { id: 'meronpan', name: 'メロンパン', image: '42メロンパン.png' },
].map((item) => ({ ...item, category: FoodCategory.DESSERT }));

export const FOOD_ITEMS = [...MEAL_ITEMS, ...DESSERT_ITEMS];

export function getFoodById(id) {
    return FOOD_ITEMS.find((item) => item.id === id) || null;
}

export function getFoodImagePath(item) {
    return `${FOOD_IMAGE_DIR[item.category]}${item.image}`;
}
