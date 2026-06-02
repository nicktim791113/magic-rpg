// 技能資料庫。
//   type: "attack" = 攻擊技（power 是攻擊力倍率）
//   type: "heal"   = 治療技（amount 是回復量）
//   sp: 使用要消耗的 SP
export const SKILLS = {
  plasma: {
    name: "電漿斬",
    type: "attack",
    sp: 8,
    power: 1.8,
    desc: "消耗 8 SP，造成 1.8 倍攻擊傷害",
  },
  heal: {
    name: "奈米治療",
    type: "heal",
    sp: 10,
    amount: 45,
    desc: "消耗 10 SP，恢復 45 HP",
  },
  heavyslash: {
    name: "強力斬",
    type: "attack",
    sp: 14,
    power: 2.6,
    desc: "消耗 14 SP，造成 2.6 倍攻擊傷害（亞瑟 Lv.3 學會）",
  },
  pierce: {
    name: "貫穿射擊",
    type: "attack",
    sp: 9,
    power: 2.1,
    desc: "消耗 9 SP，造成 2.1 倍攻擊傷害（艾拉 Lv.2 學會）",
  },
  cure: {
    name: "治癒之術",
    type: "heal",
    sp: 12,
    amount: 65,
    desc: "消耗 12 SP，恢復 65 HP（艾拉 Lv.4 學會）",
  },
};
