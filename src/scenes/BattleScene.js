import Phaser from "phaser";
import { FONT, GAME_WIDTH, GAME_HEIGHT } from "../data/constants.js";
import { gameState, gainExp, removeItem } from "../data/gameState.js";
import { ENEMIES } from "../data/enemies.js";
import { ITEMS } from "../data/items.js";
import { SKILLS } from "../data/skills.js";
import { spriteOrShape } from "../util/art.js";

// ============================================================
// BattleScene = 回合制戰鬥。
// 流程：玩家選指令 → 結算 → 敵人反擊 → 回到玩家，直到一方倒下。
// 用 this.state 控制現在輪到誰：
//   "menu"  = 等玩家從選單選指令
//   "busy"  = 演出中（顯示訊息、等一下），這時不接受輸入
// ============================================================
export default class BattleScene extends Phaser.Scene {
  constructor() {
    super("BattleScene");
  }

  init(data) {
    this.enemyKey = data.enemyKey;
    this.enemyId = data.enemyId;
    this.returnPlanet = data.returnPlanet;
    const def = ENEMIES[data.enemyId];
    // 複製一份敵人資料（戰鬥中會扣血，不要改到原始資料）
    this.enemy = { ...def, hp: def.hp, maxHp: def.hp };
    this.state = "busy";
    this.menuType = "main";
    this.menuIndex = 0;
  }

  create() {
    // 太空背景 + 星點
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0b0e1a);
    for (let i = 0; i < 90; i++) {
      this.add.circle(Math.random() * GAME_WIDTH, Math.random() * GAME_HEIGHT * 0.7, Math.random() * 1.6 + 0.3, 0xffffff, Math.random() * 0.6 + 0.2);
    }

    // 敵人
    const ex = GAME_WIDTH / 2, ey = 175;
    this.enemySprite = spriteOrShape(this, ex, ey, `enemy-${this.enemyId}`, this.enemy.r * 2.4, () => {
      const shape =
        this.enemy.shape === "rect"
          ? this.add.rectangle(ex, ey, this.enemy.r * 2, this.enemy.r * 2, this.enemy.color)
          : this.add.circle(ex, ey, this.enemy.r, this.enemy.color);
      return shape.setStrokeStyle(3, 0xffffff);
    });
    this.add.text(ex, ey - this.enemy.r - 34, this.enemy.name, { fontSize: "22px", color: "#ffffff", fontFamily: FONT }).setOrigin(0.5);
    // 敵人血條
    this.add.rectangle(ex, ey - this.enemy.r - 12, 160, 12, 0x333333).setOrigin(0.5);
    this.enemyHpBar = this.add.rectangle(ex - 80, ey - this.enemy.r - 12, 160, 12, 0xff5555).setOrigin(0, 0.5);

    // 玩家面板（左下）
    this.add.rectangle(155, 470, 290, 130, 0x10141f, 0.92).setStrokeStyle(2, 0x88aaff);
    this.playerText = this.add.text(28, 418, "", { fontSize: "16px", color: "#ffffff", fontFamily: FONT, lineSpacing: 6 });

    // 訊息列（中間）
    this.msgText = this.add.text(GAME_WIDTH / 2, 320, "", { fontSize: "20px", color: "#ffe082", fontFamily: FONT, align: "center", wordWrap: { width: 720 } }).setOrigin(0.5);

    // 指令選單（右下）
    this.add.rectangle(575, 470, 390, 130, 0x10141f, 0.92).setStrokeStyle(2, 0x88aaff);
    this.menuTexts = [];

    // 輸入：用方向鍵移動游標、空白鍵確定、ESC 返回上層選單
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys("SPACE,ESC");

    this.updatePlayerText();
    this.updateBars();
    this.cameras.main.fadeIn(250);

    // 開場白，停一下再開放選單
    this.showMessage(`野生的 ${this.enemy.name} 出現了！`);
    this.time.delayedCall(900, () => this.toMenu("要怎麼行動？"));
  }

  update() {
    if (this.state !== "menu") return; // 只有輪到玩家選指令時才接受輸入

    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      this.menuIndex = (this.menuIndex - 1 + this.menuLabels.length) % this.menuLabels.length;
      this.renderCursor();
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
      this.menuIndex = (this.menuIndex + 1) % this.menuLabels.length;
      this.renderCursor();
    } else if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
      this.confirm();
    } else if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) {
      if (this.menuType !== "main") this.buildMenu("main");
    }
  }

  // ---------------- 選單 ----------------
  toMenu(msg) {
    this.state = "menu";
    if (msg) this.showMessage(msg);
    this.buildMenu("main");
  }

  buildMenu(type) {
    this.menuType = type;
    this.menuIndex = 0;
    this.menuTexts.forEach((t) => t.destroy());
    this.menuTexts = [];

    let labels = [];
    if (type === "main") {
      labels = ["攻擊", "技能", "道具", "逃跑"];
    } else if (type === "skills") {
      labels = gameState.player.skills.map((id) => `${SKILLS[id].name}  (SP ${SKILLS[id].sp})`);
      labels.push("← 返回");
    } else if (type === "items") {
      if (gameState.inventory.length === 0) labels = ["（沒有道具）", "← 返回"];
      else {
        labels = gameState.inventory.map((it) => `${ITEMS[it.id].name} ×${it.count}`);
        labels.push("← 返回");
      }
    }
    this.menuLabels = labels;

    const startX = 460, startY = 420;
    labels.forEach((label, i) => {
      this.menuTexts.push(this.add.text(startX, startY + i * 26, label, { fontSize: "18px", color: "#cccccc", fontFamily: FONT }));
    });
    this.renderCursor();
  }

  renderCursor() {
    this.menuTexts.forEach((t, i) => {
      t.setColor(i === this.menuIndex ? "#ffe082" : "#cccccc");
      t.setText((i === this.menuIndex ? "► " : "   ") + this.menuLabels[i]);
    });
  }

  confirm() {
    if (this.menuType === "main") {
      if (this.menuIndex === 0) this.doAttack();
      else if (this.menuIndex === 1) this.buildMenu("skills");
      else if (this.menuIndex === 2) this.buildMenu("items");
      else this.doFlee();
    } else if (this.menuType === "skills") {
      const skills = gameState.player.skills;
      if (this.menuIndex >= skills.length) this.buildMenu("main");
      else this.doSkill(skills[this.menuIndex]);
    } else if (this.menuType === "items") {
      const inv = gameState.inventory;
      if (inv.length === 0 || this.menuIndex >= inv.length) this.buildMenu("main");
      else this.doItem(inv[this.menuIndex].id);
    }
  }

  // 開始演出一個動作：鎖住輸入、把選單藏起來
  beginAction() {
    this.state = "busy";
    this.menuTexts.forEach((t) => t.setVisible(false));
  }

  // ---------------- 玩家的行動 ----------------
  doAttack() {
    this.beginAction();
    const dmg = this.calcDamage(gameState.player.atk, this.enemy.def);
    this.enemy.hp -= dmg;
    this.hitShake(this.enemySprite);
    this.updateBars();
    this.showMessage(`你發動攻擊，對 ${this.enemy.name} 造成 ${dmg} 點傷害！`);
    this.time.delayedCall(950, () => this.afterPlayerAction());
  }

  doSkill(id) {
    const sk = SKILLS[id];
    if (gameState.player.sp < sk.sp) {
      this.beginAction(); // 鎖住輸入，避免重複觸發
      this.showMessage("SP 不足！");
      this.time.delayedCall(700, () => this.toMenu("要怎麼行動？"));
      return;
    }
    this.beginAction();
    gameState.player.sp -= sk.sp;
    if (sk.type === "attack") {
      const dmg = Math.floor(this.calcDamage(gameState.player.atk, this.enemy.def) * sk.power);
      this.enemy.hp -= dmg;
      this.hitShake(this.enemySprite);
      this.showMessage(`你使出「${sk.name}」，造成 ${dmg} 點傷害！`);
    } else {
      gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + sk.amount);
      this.showMessage(`你使用「${sk.name}」，恢復了 ${sk.amount} HP！`);
    }
    this.updatePlayerText();
    this.updateBars();
    this.time.delayedCall(950, () => this.afterPlayerAction());
  }

  doItem(id) {
    this.beginAction();
    const def = ITEMS[id];
    removeItem(id, 1);
    if (def.type === "heal") {
      gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + def.amount);
      this.showMessage(`使用 ${def.name}，恢復了 ${def.amount} HP！`);
    } else {
      gameState.player.sp = Math.min(gameState.player.maxSp, gameState.player.sp + def.amount);
      this.showMessage(`使用 ${def.name}，恢復了 ${def.amount} SP！`);
    }
    this.updatePlayerText();
    this.time.delayedCall(950, () => this.afterPlayerAction());
  }

  doFlee() {
    this.beginAction();
    if (Math.random() < 0.55) {
      this.showMessage("成功逃脫！");
      this.time.delayedCall(800, () => this.endBattle());
    } else {
      this.showMessage("逃跑失敗！");
      this.time.delayedCall(800, () => this.enemyTurn());
    }
  }

  afterPlayerAction() {
    if (this.enemy.hp <= 0) this.victory();
    else this.enemyTurn();
  }

  // ---------------- 敵人的行動 ----------------
  enemyTurn() {
    this.state = "busy";
    const dmg = this.calcDamage(this.enemy.atk, gameState.player.def);
    gameState.player.hp = Math.max(0, gameState.player.hp - dmg);
    this.cameras.main.shake(150, 0.012);
    this.updatePlayerText();
    this.updateBars();
    this.showMessage(`${this.enemy.name} 反擊，對你造成 ${dmg} 點傷害！`);
    this.time.delayedCall(950, () => {
      if (gameState.player.hp <= 0) this.defeat();
      else this.toMenu("要怎麼行動？");
    });
  }

  // ---------------- 勝 / 敗 ----------------
  victory() {
    this.state = "busy";
    const { exp, gold, name } = this.enemy;
    gameState.gold += gold;
    gameState.cleared.add(this.enemyKey); // 這隻怪這趟不再出現
    const levels = gainExp(exp);
    this.updatePlayerText();
    this.tweens.add({ targets: this.enemySprite, alpha: 0, scale: 0.3, duration: 400 });
    this.showMessage(`戰勝 ${name}！獲得 ${exp} 經驗值、${gold} 金幣。`);
    this.time.delayedCall(1100, () => {
      if (levels.length > 0) {
        this.showMessage(`等級提升！你現在是 Lv.${gameState.player.level}！`);
        this.time.delayedCall(1100, () => this.endBattle());
      } else {
        this.endBattle();
      }
    });
  }

  defeat() {
    this.state = "busy";
    gameState.player.hp = Math.max(1, Math.floor(gameState.player.maxHp / 2));
    gameState.currentPlanet = "station";
    gameState.returnPos = null;
    this.showMessage("你被擊倒了……緊急傳送回太空站。");
    this.time.delayedCall(1500, () => {
      this.cameras.main.fadeOut(250);
      this.time.delayedCall(260, () => this.scene.start("WorldScene", { planet: "station" }));
    });
  }

  endBattle() {
    this.cameras.main.fadeOut(250);
    this.time.delayedCall(260, () => this.scene.start("WorldScene", { planet: this.returnPlanet, fromBattle: true }));
  }

  // ---------------- 小工具 ----------------
  calcDamage(atk, def) {
    const base = Math.max(1, atk - Math.floor(def / 2));
    const variance = 0.85 + Math.random() * 0.3; // 傷害浮動 ±15%
    return Math.max(1, Math.round(base * variance));
  }

  hitShake(obj) {
    const ox = obj.x;
    this.tweens.add({ targets: obj, x: ox + 8, duration: 50, yoyo: true, repeat: 2, onComplete: () => { obj.x = ox; } });
  }

  updateBars() {
    this.enemyHpBar.scaleX = Math.max(0, this.enemy.hp) / this.enemy.maxHp;
  }

  updatePlayerText() {
    const p = gameState.player;
    this.playerText.setText(`${p.name}  Lv.${p.level}\nHP ${p.hp} / ${p.maxHp}\nSP ${p.sp} / ${p.maxSp}\n攻擊 ${p.atk}　防禦 ${p.def}`);
  }

  showMessage(msg) {
    this.msgText.setText(msg);
  }
}
