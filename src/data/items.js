// 道具資料庫。type 決定使用時的效果：
//   heal = 回 HP， sp = 回 SP
export const ITEMS = {
  potion: {
    name: "治療藥劑",
    type: "heal",
    amount: 35,
    desc: "恢復 35 HP",
    color: 0xff5577,
  },
  hipotion: {
    name: "高效治療劑",
    type: "heal",
    amount: 90,
    desc: "恢復 90 HP",
    color: 0xff2266,
  },
  ether: {
    name: "能量電池",
    type: "sp",
    amount: 20,
    desc: "恢復 20 SP",
    color: 0x3399ff,
  },
};
