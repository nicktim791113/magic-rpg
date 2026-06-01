// ============================================================
// 星球資料庫 —— 這是整個遊戲世界的「藍圖」。
// 想新增一顆星球？在這裡多加一筆就好，程式會自動處理。
//
// 每顆星球可以有：
//   size      地圖大小
//   spawn     玩家進來時的出生點
//   ground/grid/accent/decorColors  配色（決定這顆星球的「風景」）
//   npcs      會講話的居民（name 名字、color 顏色、lines 台詞陣列）
//   enemies   地圖上的怪物（走過去就觸發戰鬥，id 對應 enemies.js）
//   items     地上的道具（走過去自動撿，id 對應 items.js）
//   portals   傳送點（走過去切換星球，to 是目標星球）
// ============================================================
export const PLANETS = {
  // ---------- 太空站（安全的樞紐，沒有怪物）----------
  station: {
    name: "起源太空站",
    size: { w: 1024, h: 768 },
    spawn: { x: 512, y: 580 },
    ground: 0x232838,
    grid: 0x39405a,
    accent: 0x5566aa,
    decorColors: [0x39405a, 0x4a5278, 0x2c3146],
    npcs: [
      {
        x: 512, y: 360, name: "指揮官 凱恩", color: 0x88aaff,
        lines: [
          "指揮官凱恩：歡迎登艦，旅人。",
          "你是我們最後的希望——星圖已經為你開啟。",
          "走到上方的傳送台，挑一顆星球去探索吧。",
          "宇宙很危險，建議先去『綠林星』練練身手。",
        ],
      },
      {
        x: 300, y: 470, name: "補給官 莉拉", color: 0xff99cc, shop: true,
        lines: [
          "補給官莉拉：需要什麼儘管說，這裡很安全。",
          "聽說『赤焰星』上有人受困了……",
          "至於『冰霜星』深處的霜雪獸，連老兵都不敢靠近。",
        ],
      },
    ],
    enemies: [],
    items: [{ x: 730, y: 470, id: "potion", count: 1 }],
    portals: [
      { x: 280, y: 160, to: "verdant", label: "綠林星" },
      { x: 512, y: 140, to: "crimson", label: "赤焰星" },
      { x: 744, y: 160, to: "frost", label: "冰霜星" },
    ],
  },

  // ---------- 綠林星（新手星球：翠綠森林）----------
  verdant: {
    name: "綠林星",
    size: { w: 1280, h: 960 },
    spawn: { x: 640, y: 850 },
    ground: 0x274d2e,
    grid: 0x3a6b42,
    accent: 0x6fcf6f,
    decorColors: [0x3a6b42, 0x55a05a, 0x86d98a, 0xcfe8a0],
    npcs: [
      {
        x: 380, y: 420, name: "植物學家 芬恩", color: 0x9be870,
        lines: [
          "植物學家芬恩：這顆星球的植物會發光，美吧？",
          "小心那些彈跳的『太空波利』，看起來可愛卻會咬人。",
          "打倒牠們可以累積經驗，變強之後再去別的星球。",
        ],
      },
      {
        x: 640, y: 700, name: "艾拉", color: 0xff77aa, sprite: "npc-aira", joinAlly: "aira",
        lines: [
          "？？？：等一下！你也是來探索這顆星球的冒險者嗎？",
          "艾拉：我叫艾拉，是個遊俠。一個人在外面太危險了……",
          "艾拉：讓我跟你一起走吧！路上我會罩你的。",
          "（艾拉成為你的第一位同伴 —— 你們的冒險正要開始。）",
        ],
      },
    ],
    enemies: [
      { x: 300, y: 680, id: "poring" },
      { x: 920, y: 640, id: "poring" },
      { x: 640, y: 560, id: "poring" },
      { x: 1020, y: 760, id: "sprout" },
      { x: 240, y: 560, id: "sprout" },
    ],
    items: [
      { x: 1080, y: 300, id: "potion", count: 1 },
      { x: 180, y: 820, id: "ether", count: 1 },
    ],
    portals: [{ x: 640, y: 110, to: "station", label: "返回太空站" }],
  },

  // ---------- 赤焰星（火山熔岩世界）----------
  crimson: {
    name: "赤焰星",
    size: { w: 1280, h: 960 },
    spawn: { x: 640, y: 850 },
    ground: 0x4d231a,
    grid: 0x6b3326,
    accent: 0xff7744,
    decorColors: [0x6b3326, 0x8a3f2a, 0xc25a33, 0xe09060],
    npcs: [
      {
        x: 940, y: 420, name: "受困探險家 達克", color: 0xffaa66,
        lines: [
          "探險家達克：終於有人來了！我的飛船在熔岩區墜毀了。",
          "這裡的機械蠍很強，你得夠強壯才能活下來。",
          "前面那瓶高效治療劑你拿去吧，算是謝禮。",
        ],
      },
    ],
    enemies: [
      { x: 380, y: 640, id: "lavabug" },
      { x: 880, y: 680, id: "lavabug" },
      { x: 600, y: 430, id: "scorpion" },
      { x: 1060, y: 560, id: "scorpion" },
    ],
    items: [{ x: 260, y: 360, id: "hipotion", count: 1 }],
    portals: [{ x: 640, y: 110, to: "station", label: "返回太空站" }],
  },

  // ---------- 冰霜星（冰雪世界，有首領）----------
  frost: {
    name: "冰霜星",
    size: { w: 1280, h: 960 },
    spawn: { x: 640, y: 850 },
    ground: 0x24405c,
    grid: 0x355d80,
    accent: 0x88ddee,
    decorColors: [0x355d80, 0x5a86a8, 0x9fcfe0, 0xdff2f8],
    npcs: [
      {
        x: 640, y: 440, name: "隱士 賢者歐拉", color: 0xbfe8ff,
        lines: [
          "賢者歐拉：你走了很遠的路，才來到這片冰原。",
          "『霜雪獸』是這顆星球的守護者，擊敗牠，你將證明自己。",
          "願星光指引你，旅人。",
        ],
      },
    ],
    enemies: [
      { x: 380, y: 640, id: "iceghost" },
      { x: 980, y: 640, id: "iceghost" },
      { x: 640, y: 300, id: "yeti" },
    ],
    items: [
      { x: 200, y: 800, id: "hipotion", count: 1 },
      { x: 1080, y: 800, id: "ether", count: 1 },
    ],
    portals: [{ x: 640, y: 110, to: "station", label: "返回太空站" }],
  },
};
