import { SKILLS } from "./skills.js";
import { EQUIPMENT } from "./equipment.js";
import { QUESTS } from "./quests.js";

// ============================================================
// gameState = 整個遊戲的「存放點」。所有場景共用同一份。
// 也負責：存檔/讀檔（localStorage）、隊友、升級、裝備。
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
      equip: { weapon: null, armor: null },
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
    quests: {}, // 任務狀態：{ id: { status, progress } }
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
    equip: { weapon: null, armor: null },
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

// 升級時自動學會的技能：{ 角色id: { 等級: 技能id } }
const LEARN_TABLE = {
  arthur: { 3: "heavyslash" },
  aira: { 2: "pierce", 4: "cure" },
};

// ---------- 裝備加成後的有效攻防 ----------
export function effAtk(m) {
  const w = m.equip && m.equip.weapon;
  return m.atk + (w && EQUIPMENT[w] ? EQUIPMENT[w].atk || 0 : 0);
}
export function effDef(m) {
  const a = m.equip && m.equip.armor;
  return m.def + (a && EQUIPMENT[a] ? EQUIPMENT[a].def || 0 : 0);
}

// ---------- 升級（可用於主角或任一同伴）----------
// 回傳 { levels: [...升到的等級], learned: [...學會的技能名稱] }
export function gainExp(amount, member = gameState.player) {
  member.exp += amount;
  const levels = [];
  const learned = [];
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
    const tbl = LEARN_TABLE[member.id];
    const learnId = tbl && tbl[member.level];
    if (learnId && !member.skills.includes(learnId)) {
      member.skills.push(learnId);
      learned.push(SKILLS[learnId].name);
    }
  }
  return { levels, learned };
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
      quests: gameState.quests,
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
    gameState.quests = d.quests || {};
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

// ---------- 任務 ----------
export function questStatus(id) {
  const q = gameState.quests[id];
  return q ? q.status : "none"; // "none" | "active" | "claimed"
}

export function acceptQuest(id) {
  if (!gameState.quests[id]) {
    gameState.quests[id] = { status: "active", progress: 0 };
    saveGame();
  }
}

export function isQuestComplete(id) {
  const q = gameState.quests[id];
  const def = QUESTS[id];
  return !!q && q.status === "active" && !!def && q.progress >= def.count;
}

// 打倒怪物時呼叫，推進相關任務進度
export function recordKill(enemyId) {
  let changed = false;
  Object.keys(gameState.quests).forEach((id) => {
    const q = gameState.quests[id];
    const def = QUESTS[id];
    if (q.status === "active" && def && def.type === "kill") {
      if (def.target === "any" || def.target === enemyId) {
        if (q.progress < def.count) {
          q.progress += 1;
          changed = true;
        }
      }
    }
  });
  if (changed) saveGame();
}

// 領取任務獎勵
export function claimQuest(id) {
  const q = gameState.quests[id];
  const def = QUESTS[id];
  if (!q || q.status !== "active" || !def) return null;
  const r = def.reward || {};
  if (r.gold) gameState.gold += r.gold;
  if (r.exp) {
    gainExp(r.exp, gameState.player);
    gameState.allies.forEach((a) => gainExp(r.exp, a));
  }
  (r.items || []).forEach((it) => addItem(it.id, it.count || 1));
  if (r.equip) addItem(r.equip, 1);
  q.status = "claimed";
  saveGame();
  return r;
}
