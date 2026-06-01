// 怪物資料庫。
//   shape: "circle" 圓形 / "rect" 方形（先用色塊當佔位圖）
//   r: 大小（半徑感覺）
//   exp / gold: 打倒後給的經驗與金幣
export const ENEMIES = {
  poring: {
    name: "太空波利",
    hp: 22, atk: 7, def: 1,
    exp: 7, gold: 5,
    color: 0xff77aa, shape: "circle", r: 26,
  },
  sprout: {
    name: "綠皮獸人",
    hp: 30, atk: 10, def: 3,
    exp: 12, gold: 8,
    color: 0x66cc66, shape: "circle", r: 24,
  },
  lavabug: {
    name: "烈焰惡魔",
    hp: 42, atk: 14, def: 5,
    exp: 20, gold: 15,
    color: 0xff6633, shape: "rect", r: 28,
  },
  scorpion: {
    name: "機械蠍",
    hp: 50, atk: 17, def: 7,
    exp: 28, gold: 22,
    color: 0xcc4422, shape: "rect", r: 30,
  },
  iceghost: {
    name: "冰晶幽靈",
    hp: 60, atk: 20, def: 8,
    exp: 38, gold: 30,
    color: 0x66ddee, shape: "circle", r: 28,
  },
  yeti: {
    name: "霜雪獸（首領）",
    hp: 90, atk: 24, def: 10,
    exp: 60, gold: 55,
    color: 0xaaddff, shape: "rect", r: 40,
  },
};
