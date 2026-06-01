// ============================================================
// gameState = 整個遊戲的「存放點」。所有場景共用同一份。
// 也負責：存檔/讀檔（localStorage）、隊友、升級。
// ============================================================

// 預設的全新遊戲狀態（「新遊戲」與「重置」都用這個）
function defaults() {
  return {
    player: {
      id: "arthur", name: "亞瑟", job: "星際騎士",
      level: 1, exp: 0, expToNext: 20,
      hp: 60, maxHp: 60, sp: 25, maxSp: 25,
      atk: 14, def: 6,
      skills: ["plasma", "heal"],
    },
    allies: [], // 加入的同伴（例如艾拉）
    gold: 0,
    inventory: [
      { id: "potion", count: 3 },
      { id: "ether", count: 1 },
    ],
    currentPlanet: "station",
    returnPos: null,
    cleared: new Set(), // 已打倒的怪 / 已撿的道具
    flags: {}, // 劇情旗標（例如 airaJoined）
  };
}

export const gameState = defaults();

// 可加入的同伴範本
const ALLY_TEMPLATES = {
  aira: {
    id: "aira", name: "艾拉", job: "遊俠",
    level: 1, exp: 0, expToNext: 20,
    hp: 45, maxHp: 45, sp: 20, maxSp: 20,
    atk: 16, def: 4,
    skills: ["plasma"],
  },
};

export function joinAlly(id) {
  if (gameState.allies.some((a) => a.id === id)) return false;
  const t = ALLY_TEMPLATES[id];
  if (!t) return false;
  gameState.allies.push({ ...t });
  gameState.flags[id + "Joined"] = true;
  return true;
}

// ---------- 背包 ----------
export function addItem(id, count = 1) {
  const slot = gameState.inventory.find((s) => s.id === id);
  if (slot) slot.count += count;
  else gameState.inventory.push({ id, count });
}

export function removeItem(id, count = 1) {
  const slot = gameState.inventory.find((s) => s.id === id);
  if (!slot) return false;
  slot.count -= count;
  if (slot.count <= 0) gameState.inventory = gameState.inventory.filter((s) => s.id !== id);
  return true;
}

// ---------- 升級（可用於主角或任一同伴）----------
export function gainExp(amount, member = gameState.player) {
  member.exp += amount;
  const levels = [];
  while (member.exp >= member.expToNext) {
    member.exp -= member.expToNext;
    member.level += 1;
    member.maxHp += 12;
    member.maxSp += 4;
    member.atk += 3;
    member.def += 2;
    member.hp = member.maxHp;
    member.sp = member.maxSp;
    member.expToNext = Math.floor(member.expToNext * 1.4);
    levels.push(member.level);
  }
  return levels;
}

// ---------- 存檔 / 讀檔（瀏覽器 localStorage）----------
const SAVE_KEY = "magicrpg-save-v1";

export function saveGame() {
  try {
    const data = {
      player: gameState.player,
      allies: gameState.allies,
      gold: gameState.gold,
      inventory: gameState.inventory,
      currentPlanet: gameState.currentPlanet,
      cleared: [...gameState.cleared], // Set 不能直接存 JSON，轉成陣列
      flags: gameState.flags,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    return false;
  }
}

export function hasSave() {
  try {
    return !!localStorage.getItem(SAVE_KEY);
  } catch (e) {
    return false;
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    Object.assign(gameState, defaults()); // 先重置再覆蓋，避免殘留
    gameState.player = d.player;
    gameState.allies = d.allies || [];
    gameState.gold = d.gold || 0;
    gameState.inventory = d.inventory || [];
    gameState.currentPlanet = d.currentPlanet || "station";
    gameState.cleared = new Set(d.cleared || []); // 陣列轉回 Set
    gameState.flags = d.flags || {};
    gameState.returnPos = null;
    return true;
  } catch (e) {
    return false;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (e) {}
}

// 新遊戲：清存檔並把狀態重置回預設
export function resetGame() {
  Object.assign(gameState, defaults());
  clearSave();
}
