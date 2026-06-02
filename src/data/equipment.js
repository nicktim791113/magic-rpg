// 裝備資料庫。slot: "weapon"(武器，加攻擊) 或 "armor"(防具，加防禦)。
// price = 商店購買價（賣出為一半）。裝備也會放在背包(inventory)裡，用裝備畫面穿上。
export const EQUIPMENT = {
  ironsword: {
    name: "鐵劍", slot: "weapon", atk: 5, price: 80, desc: "攻擊 +5",
  },
  plasmasword: {
    name: "電漿劍", slot: "weapon", atk: 12, price: 240, desc: "攻擊 +12",
  },
  leatherarmor: {
    name: "皮甲", slot: "armor", def: 4, price: 70, desc: "防禦 +4",
  },
  powerarmor: {
    name: "動力裝甲", slot: "armor", def: 10, price: 220, desc: "防禦 +10",
  },
};
