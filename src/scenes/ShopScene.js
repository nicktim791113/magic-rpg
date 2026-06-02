import Phaser from "phaser";
import { FONT, GAME_WIDTH, GAME_HEIGHT } from "../data/constants.js";
import { gameState, addItem, removeItem, saveGame } from "../data/gameState.js";
import { ITEMS } from "../data/items.js";
import { EQUIPMENT } from "../data/equipment.js";

// 商店進貨（id 對應 items.js 或 equipment.js）
const BUY_STOCK = ["potion", "hipotion", "ether", "ironsword", "leatherarmor", "plasmasword", "powerarmor"];

// 查 id 的資訊（道具或裝備皆可）
function info(id) {
  return ITEMS[id] || EQUIPMENT[id] || null;
}

// ============================================================
// ShopScene = 商店。←→ 切換「買 / 賣」，↑↓ 選，空白鍵 成交，ESC 離開。
// 賣出價 = 購買價的一半。
// ============================================================
export default class ShopScene extends Phaser.Scene {
  constructor() {
    super("ShopScene");
  }

  init(data) {
    this.returnPlanet = data.returnPlanet || "station";
    this.mode = "buy";
    this.index = 0;
  }

  create() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0a0e18);
    this.add.rectangle(GAME_WIDTH / 2, 60, 560, 52, 0x10141f, 0.95).setStrokeStyle(2, 0x88aaff);
    this.titleText = this.add.text(GAME_WIDTH / 2, 60, "", { fontSize: "24px", color: "#ffe082", fontFamily: FONT }).setOrigin(0.5);
    this.goldText = this.add.text(GAME_WIDTH - 40, 104, "", { fontSize: "18px", color: "#ffd54f", fontFamily: FONT }).setOrigin(1, 0);

    this.rowTexts = [];
    this.descText = this.add.text(GAME_WIDTH / 2, 452, "", { fontSize: "16px", color: "#cccccc", fontFamily: FONT, align: "center", wordWrap: { width: 600 } }).setOrigin(0.5);
    this.msgText = this.add.text(GAME_WIDTH / 2, 498, "", { fontSize: "18px", color: "#7cfc9e", fontFamily: FONT }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 26, "←→ 買/賣　·　↑↓ 選擇　·　空白鍵 成交／離開　·　ESC 離開", { fontSize: "15px", color: "#aaaaaa", fontFamily: FONT }).setOrigin(0.5);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys("SPACE,ESC");
    this.cameras.main.fadeIn(200);
    this.build();
  }

  build() {
    if (this.mode === "buy") {
      this.options = [...BUY_STOCK.map((id) => ({ id })), { leave: true }];
    } else {
      // 賣：背包裡所有東西（道具與未裝備的裝備）
      this.options = [...gameState.inventory.map((s) => ({ id: s.id, count: s.count })), { leave: true }];
    }
    if (this.index >= this.options.length) this.index = Math.max(0, this.options.length - 1);
    this.rowTexts.forEach((t) => t.destroy());
    this.rowTexts = this.options.map((o, i) =>
      this.add.text(180, 150 + i * 38, "", { fontSize: "19px", color: "#ffffff", fontFamily: FONT })
    );
    this.render();
  }

  render() {
    this.titleText.setText(this.mode === "buy" ? "莉拉的補給站　【買】" : "莉拉的補給站　【賣】");
    this.goldText.setText("金幣 " + gameState.gold);
    this.options.forEach((o, i) => {
      const sel = i === this.index;
      let label;
      if (o.leave) label = "離開";
      else if (this.mode === "buy") label = `${info(o.id).name}　—　${info(o.id).price} 金`;
      else label = `${info(o.id).name} ×${o.count}　—　賣 ${Math.floor(info(o.id).price / 2)} 金`;
      this.rowTexts[i].setColor(sel ? "#ffe082" : "#ffffff").setText((sel ? "► " : "   ") + label);
    });
    const cur = this.options[this.index];
    this.descText.setText(cur && !cur.leave ? info(cur.id).desc : (this.mode === "buy" ? "離開商店" : "選擇要賣出的物品"));
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) { this.index = (this.index - 1 + this.options.length) % this.options.length; this.render(); }
    else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) { this.index = (this.index + 1) % this.options.length; this.render(); }
    else if (Phaser.Input.Keyboard.JustDown(this.cursors.left) || Phaser.Input.Keyboard.JustDown(this.cursors.right)) { this.toggleMode(); }
    else if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) { this.choose(); }
    else if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) { this.leave(); }
  }

  toggleMode() {
    this.mode = this.mode === "buy" ? "sell" : "buy";
    this.index = 0;
    this.msgText.setText("");
    this.build();
  }

  choose() {
    const o = this.options[this.index];
    if (o.leave) { this.leave(); return; }
    if (this.mode === "buy") {
      const price = info(o.id).price;
      if (gameState.gold >= price) {
        gameState.gold -= price;
        addItem(o.id, 1);
        saveGame();
        this.msgText.setColor("#7cfc9e").setText(`買了 ${info(o.id).name}！`);
      } else {
        this.msgText.setColor("#ff6b6b").setText("金幣不足！");
      }
      this.render();
    } else {
      const sp = Math.floor(info(o.id).price / 2);
      removeItem(o.id, 1);
      gameState.gold += sp;
      saveGame();
      this.msgText.setColor("#7cfc9e").setText(`賣出 ${info(o.id).name}，得到 ${sp} 金！`);
      this.build(); // 賣後庫存可能變動，重建清單
    }
  }

  leave() {
    this.cameras.main.fadeOut(180);
    this.time.delayedCall(190, () => this.scene.start("WorldScene", { planet: this.returnPlanet, fromBattle: true }));
  }
}
