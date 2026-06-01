// ============================================================
// gameState = 整個遊戲的「存放點」。
// 玩家數值、金錢、背包、目前在哪顆星球……都放這裡。
// 因為它是一個被 import 共用的物件，所有場景（探索、戰鬥）讀到的
// 都是同一份資料 —— 在戰鬥扣的血，回到地圖也看得到。
// ============================================================

export const gameState = {
  // 主角
  player: {
    name: "亞瑟",
    job: "星際騎士",
    level: 1,
    exp: 0,
    expToNext: 20, // 升到下一級需要的經驗值
    hp: 60,
    maxHp: 60,
    sp: 25, // SP = 技能點數（放技能要消耗）
    maxSp: 25,
    atk: 14, // 攻擊力
    def: 6, // 防禦力
    skills: ["plasma", "heal"], // 學會的技能（對應 skills.js 的 id）
  },

  gold: 0, // 金幣

  // 背包：每一格是 { id: 道具編號, count: 數量 }
  inventory: [
    { id: "potion", count: 3 },
    { id: "ether", count: 1 },
  ],

  currentPlanet: "station", // 目前所在星球（一開始在太空站）
  returnPos: null, // 從戰鬥返回時，要把玩家放回的座標
  cleared: new Set(), // 已打倒的怪物 / 已撿走的道具（這趟遊戲不再出現）
};

// 在背包加入道具
export function addItem(id, count = 1) {
  const slot = gameState.inventory.find((s) => s.id === id);
  if (slot) slot.count += count;
  else gameState.inventory.push({ id, count });
}

// 從背包移除道具（用掉一個）
export function removeItem(id, count = 1) {
  const slot = gameState.inventory.find((s) => s.id === id);
  if (!slot) return false;
  slot.count -= count;
  if (slot.count <= 0) {
    gameState.inventory = gameState.inventory.filter((s) => s.id !== id);
  }
  return true;
}

// 獲得經驗值，並處理「升級」（可能一次升好幾級）。
// 回傳這次升到的等級陣列，例如 [2, 3] 代表連升兩級。
export function gainExp(amount) {
  const p = gameState.player;
  p.exp += amount;
  const levelsGained = [];
  while (p.exp >= p.expToNext) {
    p.exp -= p.expToNext;
    p.level += 1;
    // 每升一級，數值成長：
    p.maxHp += 12;
    p.maxSp += 4;
    p.atk += 3;
    p.def += 2;
    p.hp = p.maxHp; // 升級回滿血
    p.sp = p.maxSp;
    p.expToNext = Math.floor(p.expToNext * 1.4); // 下一級需要更多經驗
    levelsGained.push(p.level);
  }
  return levelsGained;
}
