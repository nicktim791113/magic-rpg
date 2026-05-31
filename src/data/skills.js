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
};
