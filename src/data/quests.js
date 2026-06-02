// 任務資料庫。
//   type:"kill"   target:"any" 或某怪物 id，count = 需要的數量
//   reward: { gold, exp, items:[{id,count}], equip:裝備id }
//   offer/progress/complete/done = 不同階段 NPC 說的話
export const QUESTS = {
  trial: {
    name: "繁星試煉",
    giver: "芬恩",
    desc: "打倒 3 隻怪物，證明你的實力。",
    type: "kill",
    target: "any",
    count: 3,
    reward: { gold: 50, exp: 20, items: [{ id: "potion", count: 2 }] },
    offer: [
      "植物學家芬恩：想變強嗎？這附近的怪物正好拿來練手。",
      "芬恩：去打倒 3 隻怪物，回來我有獎勵給你。",
      "（接下了任務「繁星試煉」）",
    ],
    progress: ["芬恩：再加把勁，打滿 3 隻就回來找我。"],
    complete: [
      "芬恩：哇，你真的做到了！這些藥劑和賞金給你。",
      "（任務完成！獲得 50 金、經驗值與治療藥劑 ×2）",
    ],
    done: ["芬恩：你已經是獨當一面的冒險者了。"],
  },
  yeti: {
    name: "冰原霸主",
    giver: "歐拉",
    desc: "擊敗冰霜星的首領『霜雪獸』。",
    type: "kill",
    target: "yeti",
    count: 1,
    reward: { gold: 120, exp: 40, equip: "plasmasword" },
    offer: [
      "賢者歐拉：冰原深處的霜雪獸，是這顆星球的守護者。",
      "歐拉：擊敗牠，證明你的覺悟。我會把祖傳的電漿劍交給你。",
      "（接下了任務「冰原霸主」）",
    ],
    progress: ["賢者歐拉：霜雪獸仍在冰原深處等著你。"],
    complete: [
      "賢者歐拉：你擊敗了牠……了不起。這把電漿劍，現在屬於你了。",
      "（任務完成！獲得 120 金與電漿劍）",
    ],
    done: ["賢者歐拉：願星光永遠指引你，勇者。"],
  },
};
