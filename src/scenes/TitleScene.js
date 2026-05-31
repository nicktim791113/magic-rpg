import Phaser from "phaser";
import { FONT, GAME_WIDTH, GAME_HEIGHT } from "../data/constants.js";
import { gameState } from "../data/gameState.js";

// ============================================================
// TitleScene = 開場標題畫面。按空白鍵開始遊戲。
// ============================================================
export default class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
  }

  create() {
    // 深色太空背景
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x05080f);

    // 隨機星點當星空
    for (let i = 0; i < 120; i++) {
      const x = Math.random() * GAME_WIDTH;
      const y = Math.random() * GAME_HEIGHT;
      const r = Math.random() * 1.6 + 0.3;
      this.add.circle(x, y, r, 0xffffff, Math.random() * 0.7 + 0.2);
    }

    // 一顆裝飾用的星球
    this.add.circle(640, 470, 90, 0x335577, 0.9);
    this.add.circle(610, 440, 90, 0x223a52, 0.5);

    // 標題
    this.add
      .text(GAME_WIDTH / 2, 190, "星界旅人", {
        fontSize: "68px", color: "#ffffff", fontFamily: FONT, fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 258, "A S T R A L   V O Y A G E R", {
        fontSize: "20px", color: "#88aaff", fontFamily: FONT,
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 340, "駕著太空船，航向每一顆未知的星球", {
        fontSize: "18px", color: "#cccccc", fontFamily: FONT,
      })
      .setOrigin(0.5);

    // 閃爍的開始提示
    const hint = this.add
      .text(GAME_WIDTH / 2, 470, "按 [空白鍵] 開始", {
        fontSize: "26px", color: "#ffe082", fontFamily: FONT,
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: hint, alpha: 0.2, duration: 700, yoyo: true, repeat: -1,
    });

    // 監聽空白鍵
    this.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.space)) {
      this.scene.start("WorldScene", { planet: gameState.currentPlanet });
    }
  }
}
