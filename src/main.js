import Phaser from "phaser";
import PreloadScene from "./scenes/PreloadScene.js";
import TitleScene from "./scenes/TitleScene.js";
import WorldScene from "./scenes/WorldScene.js";
import BattleScene from "./scenes/BattleScene.js";
import ShopScene from "./scenes/ShopScene.js";
import { gameState } from "./data/gameState.js";
import * as GS from "./data/gameState.js";

// ============================================================
// 這裡是整個遊戲的「總開關」。
// Phaser 會依照下面這份 config 建立遊戲。
// ============================================================
const config = {
  type: Phaser.AUTO, // 自動選擇 WebGL 或 Canvas 來畫面
  width: 800, // 遊戲畫面寬（像素）
  height: 600, // 遊戲畫面高（像素）
  parent: "game", // 把遊戲塞進 index.html 裡 id="game" 的那個 div
  backgroundColor: "#05080f",
  physics: {
    default: "arcade", // 使用 arcade 物理系統（最簡單、最適合 2D）
    arcade: {
      debug: false, // 想看碰撞框時改成 true
    },
  },
  // 場景清單。「第一個」會在開場時啟動。
  // 太空 RPG 流程：標題 → 探索星球(World) → 戰鬥(Battle)。
  scene: [PreloadScene, TitleScene, WorldScene, BattleScene, ShopScene],
};

// 建立遊戲！
const game = new Phaser.Game(config);

// 方便除錯：把遊戲實例與存檔狀態掛到 window，可在瀏覽器 console 直接觀察
window.game = game;
window.gameState = gameState;
window.GS = GS;
