import Phaser from "phaser";
import { FONT, GAME_WIDTH, GAME_HEIGHT } from "../data/constants.js";
import { ASSET_KEYS } from "../data/assetManifest.js";

// ============================================================
// PreloadScene = 開場前先把圖片素材載入。
// 依照 assetManifest.js（由 npm run art 自動產生）載入 public/assets/ 的圖。
// 還沒有任何圖時，這裡什麼都不載，直接進標題（遊戲改用色塊佔位）。
// ============================================================
export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload() {
    // 載入提示畫面
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x05080f);
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "載入中…", { fontSize: "20px", color: "#88aaff", fontFamily: FONT })
      .setOrigin(0.5);

    // import.meta.env.BASE_URL：開發時是 "/"，正式建置是 "/magic-rpg/"，
    // 這樣不管本機或線上，圖片路徑都正確。
    const base = import.meta.env.BASE_URL || "/";
    ASSET_KEYS.forEach((key) => {
      this.load.image(key, `${base}assets/${key}.png`);
    });
  }

  create() {
    this.scene.start("TitleScene");
  }
}
