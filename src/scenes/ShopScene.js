import Phaser from "phaser";
import { FONT, GAME_WIDTH, GAME_HEIGHT } from "../data/constants.js";
import { gameState, addItem, saveGame } from "../data/gameState.js";
import { ITEMS } from "../data/items.js";

// 商店販售的道具（id 對應 items.js）
const SHOP_ITEMS = ["potion", "hipotion", "ether"];

// ============================================================
// ShopScene = 商店。用金幣購買道具。↑↓ 選、空白鍵 買、ESC 離開。
// ============================================================
export default class ShopScene extends Phaser.Scene {
  constructor() {
    super("ShopScene");
  }

  init(data) {
    this.returnPlanet = data.returnPlanet || "station";
    this.index = 0;
  }

  create() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0a0e18);
    this.add.rectangle(GAME_WIDTH / 2, 66, 560, 56, 0x10141f, 0.95).setStrokeStyle(2, 0x88aaff);
    this.add.text(GAME_WIDTH / 2, 66, "莉拉的補給站", { fontSize: "26px", color: "#ffe082", fontFamily: FONT }).setOrigin(0.5);

    this.goldText = this.add.text(GAME_WIDTH - 40, 118, "", { fontSize: "18px", color: "#ffd54f", fontFamily: FONT }).setOrigin(1, 0);

    this.options = [...SHOP_ITEMS, "__leave__"];
    this.rowTexts = this.options.map((id, i) =>
      this.add.text(190, 168 + i * 46, "", { fontSize: "20px", color: "#ffffff", fontFamily: FONT })
    );

    this.descText = this.add.text(GAME_WIDTH / 2, 430, "", { fontSize: "16px", color: "#cccccc", fontFamily: FONT, align: "center", wordWrap: { width: 560 } }).setOrigin(0.5);
    this.msgText = this.add.text(GAME_WIDTH / 2, 480, "", { fontSize: "18px", color: "#7cfc9e", fontFamily: FONT }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 28, "↑↓ 選擇　·　空白鍵 購買／離開　·　ESC 離開", { fontSize: "15px", color: "#aaaaaa", fontFamily: FONT }).setOrigin(0.5);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys("SPACE,ESC");
    this.cameras.main.fadeIn(200);
    this.render();
  }

  render() {
    this.goldText.setText("金幣 " + gameState.gold);
    this.options.forEach((id, i) => {
      const sel = i === this.index;
      const label = id === "__leave__" ? "離開" : `${ITEMS[id].name}　—　${ITEMS[id].price} 金`;
      this.rowTexts[i].setColor(sel ? "#ffe082" : "#ffffff").setText((sel ? "► " : "   ") + label);
    });
    const cur = this.options[this.index];
    this.descText.setText(cur === "__leave__" ? "離開商店" : ITEMS[cur].desc);
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      this.index = (this.index - 1 + this.options.length) % this.options.length;
      this.render();
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
      this.index = (this.index + 1) % this.options.length;
      this.render();
    } else if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
      this.choose();
    } else if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) {
      this.leave();
    }
  }

  choose() {
    const id = this.options[this.index];
    if (id === "__leave__") {
      this.leave();
      return;
    }
    const price = ITEMS[id].price;
    if (gameState.gold >= price) {
      gameState.gold -= price;
      addItem(id, 1);
      saveGame();
      this.msgText.setColor("#7cfc9e").setText(`買了 ${ITEMS[id].name}！`);
    } else {
      this.msgText.setColor("#ff6b6b").setText("金幣不足！");
    }
    this.render();
  }

  leave() {
    this.cameras.main.fadeOut(180);
    this.time.delayedCall(190, () => this.scene.start("WorldScene", { planet: this.returnPlanet, fromBattle: true }));
  }
}
