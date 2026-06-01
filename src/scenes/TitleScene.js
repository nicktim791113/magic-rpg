import Phaser from "phaser";
import { FONT, GAME_WIDTH, GAME_HEIGHT } from "../data/constants.js";
import { gameState, hasSave, loadGame, resetGame } from "../data/gameState.js";

// ============================================================
// TitleScene = 開場標題畫面。
// 有存檔時提供「繼續遊戲 / 新遊戲」；沒有存檔時就「開始冒險」。
// ============================================================
export default class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
  }

  create() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x05080f);
    for (let i = 0; i < 120; i++) {
      this.add.circle(Math.random() * GAME_WIDTH, Math.random() * GAME_HEIGHT, Math.random() * 1.6 + 0.3, 0xffffff, Math.random() * 0.7 + 0.2);
    }
    this.add.circle(640, 470, 90, 0x335577, 0.9);
    this.add.circle(610, 440, 90, 0x223a52, 0.5);

    this.add.text(GAME_WIDTH / 2, 170, "星界旅人", { fontSize: "68px", color: "#ffffff", fontFamily: FONT, fontStyle: "bold" }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 238, "A S T R A L   V O Y A G E R", { fontSize: "20px", color: "#88aaff", fontFamily: FONT }).setOrigin(0.5);

    // 依是否有存檔決定選單
    this.options = hasSave() ? ["繼續遊戲", "新遊戲"] : ["開始冒險"];
    this.index = 0;
    this.optionTexts = this.options.map((label, i) =>
      this.add.text(GAME_WIDTH / 2, 360 + i * 52, label, { fontSize: "28px", color: "#ffffff", fontFamily: FONT }).setOrigin(0.5)
    );
    this.renderCursor();

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40, "↑↓ 選擇　·　空白鍵 確定", { fontSize: "16px", color: "#aaaaaa", fontFamily: FONT }).setOrigin(0.5);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  renderCursor() {
    this.optionTexts.forEach((t, i) => {
      t.setColor(i === this.index ? "#ffe082" : "#cccccc");
      t.setText((i === this.index ? "▶ " : "") + this.options[i]);
    });
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      this.index = (this.index - 1 + this.options.length) % this.options.length;
      this.renderCursor();
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
      this.index = (this.index + 1) % this.options.length;
      this.renderCursor();
    } else if (Phaser.Input.Keyboard.JustDown(this.space)) {
      this.choose();
    }
  }

  choose() {
    const label = this.options[this.index];
    if (label === "繼續遊戲") {
      loadGame();
    } else {
      resetGame(); // 新遊戲：重置並清存檔
    }
    this.scene.start("WorldScene", { planet: gameState.currentPlanet });
  }
}
