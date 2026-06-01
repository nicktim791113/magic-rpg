import Phaser from "phaser";
import { FONT, GAME_WIDTH, GAME_HEIGHT } from "../data/constants.js";
import { gameState, addItem } from "../data/gameState.js";
import { PLANETS } from "../data/planets.js";
import { ENEMIES } from "../data/enemies.js";
import { ITEMS } from "../data/items.js";
import { spriteOrShape } from "../util/art.js";

// ============================================================
// WorldScene = 俯視角「星球探索」場景。
// 同一個場景會依照「目前在哪顆星球」載入不同的地圖內容。
// ============================================================
export default class WorldScene extends Phaser.Scene {
  constructor() {
    super("WorldScene");
  }

  // init 在 create 之前被呼叫，用來接收「要載入哪顆星球」等資料
  init(data) {
    this.planetId = data.planet || gameState.currentPlanet || "station";
    gameState.currentPlanet = this.planetId;
    this.fromBattle = !!data.fromBattle; // 是不是剛打完仗回來
    this.transitioning = false; // 防止切換場景時重複觸發
  }

  create() {
    const planet = PLANETS[this.planetId];
    this.planet = planet;
    const W = planet.size.w;
    const H = planet.size.h;

    this.physics.world.setBounds(0, 0, W, H);
    this.cameras.main.setBounds(0, 0, W, H);

    this.drawGround(W, H, planet);
    this.drawDecor(W, H, planet);

    // --- 傳送點 ---
    this.portals = [];
    (planet.portals || []).forEach((p) => {
      this.add.rectangle(p.x, p.y, 72, 72, planet.accent, 0.55).setStrokeStyle(3, 0xffffff);
      this.add.circle(p.x, p.y, 14, 0xffffff, 0.95);
      this.add.text(p.x, p.y - 58, p.label, { fontSize: "16px", color: "#ffffff", fontFamily: FONT, backgroundColor: "#00000088", padding: { x: 6, y: 3 } }).setOrigin(0.5);
      this.portals.push(p);
    });

    // --- 地上的道具 ---
    this.groundItems = [];
    (planet.items || []).forEach((it, i) => {
      const key = `${this.planetId}:item:${i}`;
      if (gameState.cleared.has(key)) return; // 已撿過就不再出現
      const def = ITEMS[it.id];
      const obj = spriteOrShape(this, it.x, it.y, `item-${it.id}`, 30, () =>
        this.add.circle(it.x, it.y, 12, def.color).setStrokeStyle(2, 0xffffff)
      );
      this.add.text(it.x, it.y - 24, def.name, { fontSize: "13px", color: "#ffff99", fontFamily: FONT }).setOrigin(0.5);
      this.groundItems.push({ ...it, key, _obj: obj });
    });

    // --- NPC（會講話）---
    this.npcs = [];
    (planet.npcs || []).forEach((n) => {
      const obj = spriteOrShape(this, n.x, n.y, n.sprite, 44, () =>
        this.add.circle(n.x, n.y, 16, n.color).setStrokeStyle(3, 0xffffff)
      );
      this.physics.add.existing(obj, true);
      this.add.text(n.x, n.y - 30, n.name, { fontSize: "14px", color: "#ffffff", fontFamily: FONT }).setOrigin(0.5);
      this.npcs.push({ ...n, _obj: obj });
    });

    // --- 怪物（走過去觸發戰鬥）---
    this.enemies = [];
    (planet.enemies || []).forEach((e, i) => {
      const key = `${this.planetId}:enemy:${i}`;
      if (gameState.cleared.has(key)) return; // 已打倒就不再出現
      const def = ENEMIES[e.id];
      const obj = spriteOrShape(this, e.x, e.y, `enemy-${e.id}`, def.r * 2, () => {
        const shape =
          def.shape === "rect"
            ? this.add.rectangle(e.x, e.y, def.r * 2, def.r * 2, def.color)
            : this.add.circle(e.x, e.y, def.r, def.color);
        return shape.setStrokeStyle(3, 0x000000);
      });
      this.add.text(e.x, e.y - def.r - 14, def.name, { fontSize: "13px", color: "#ffcccc", fontFamily: FONT }).setOrigin(0.5);
      this.enemies.push({ ...e, key, def, _obj: obj });
    });

    // --- 玩家 ---
    const spawn = this.fromBattle && gameState.returnPos ? gameState.returnPos : planet.spawn;
    this.player = spriteOrShape(this, spawn.x, spawn.y, "player", 32, () =>
      this.add.circle(spawn.x, spawn.y, 14, 0xffe082).setStrokeStyle(3, 0xff8f00)
    );
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.npcs.forEach((n) => this.physics.add.collider(this.player, n._obj));

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    // --- 輸入 ---
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys("W,A,S,D,SPACE,I,ESC");

    // --- UI ---
    this.createDialogueBox();
    this.createHud();
    this.createInventoryPanel();

    // 剛打完仗回來：給一小段「無敵時間」，避免一出生又馬上撞到怪
    this.battleGrace = this.fromBattle;
    if (this.fromBattle) this.time.delayedCall(700, () => { this.battleGrace = false; });

    this.cameras.main.fadeIn(300);
  }

  update() {
    if (this.transitioning) return;
    this.updateHud();

    // 對話中 / 背包開啟時：不能移動
    if (this.dialogueActive || this.inventoryOpen) {
      this.player.body.setVelocity(0, 0);
      if (this.dialogueActive && Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) this.advanceDialogue();
      if (this.inventoryOpen && (Phaser.Input.Keyboard.JustDown(this.keys.I) || Phaser.Input.Keyboard.JustDown(this.keys.ESC))) this.toggleInventory();
      return;
    }

    // 開 / 關背包
    if (Phaser.Input.Keyboard.JustDown(this.keys.I)) { this.toggleInventory(); return; }

    // 移動
    const speed = 230;
    let vx = 0, vy = 0;
    if (this.cursors.left.isDown || this.keys.A.isDown) vx = -speed;
    else if (this.cursors.right.isDown || this.keys.D.isDown) vx = speed;
    if (this.cursors.up.isDown || this.keys.W.isDown) vy = -speed;
    else if (this.cursors.down.isDown || this.keys.S.isDown) vy = speed;
    this.player.body.setVelocity(vx, vy);

    const px = this.player.x, py = this.player.y;

    // 撿道具
    this.groundItems = this.groundItems.filter((it) => {
      if (Phaser.Math.Distance.Between(px, py, it.x, it.y) < 28) {
        addItem(it.id, it.count || 1);
        gameState.cleared.add(it.key);
        it._obj.destroy();
        this.flashMessage(`撿到 ${ITEMS[it.id].name}！`);
        return false;
      }
      return true;
    });

    // 傳送
    for (const p of this.portals) {
      if (Phaser.Math.Distance.Between(px, py, p.x, p.y) < 42) { this.usePortal(p); return; }
    }

    // 跟 NPC 對話
    for (const n of this.npcs) {
      if (Phaser.Math.Distance.Between(px, py, n.x, n.y) < 56 && Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
        this.startDialogue(n.name, n.lines); return;
      }
    }

    // 碰到怪物 → 戰鬥
    if (!this.battleGrace) {
      for (const e of this.enemies) {
        if (Phaser.Math.Distance.Between(px, py, e.x, e.y) < e.def.r + 14) { this.startBattle(e); return; }
      }
    }
  }

  // ---------------- 場景切換 ----------------
  usePortal(p) {
    this.transitioning = true;
    gameState.returnPos = null;
    gameState.currentPlanet = p.to;
    this.cameras.main.fadeOut(250);
    this.time.delayedCall(260, () => this.scene.start("WorldScene", { planet: p.to }));
  }

  startBattle(e) {
    this.transitioning = true;
    // 記住現在位置，戰鬥結束回來時放在這附近
    gameState.returnPos = { x: this.player.x, y: this.player.y + 36 };
    this.cameras.main.fadeOut(220);
    this.time.delayedCall(230, () =>
      this.scene.start("BattleScene", { enemyId: e.id, enemyKey: e.key, returnPlanet: this.planetId })
    );
  }

  // ---------------- 畫面元件 ----------------
  drawGround(w, h, planet) {
    // 有地面圖就鋪成可重複的材質；沒有就畫原本的色塊格線
    const key = `ground-${this.planetId}`;
    if (this.textures.exists(key)) {
      this.add.tileSprite(0, 0, w, h, key).setOrigin(0, 0);
      return;
    }
    const g = this.add.graphics();
    g.fillStyle(planet.ground, 1);
    g.fillRect(0, 0, w, h);
    g.lineStyle(1, planet.grid, 0.6);
    for (let x = 0; x <= w; x += 48) g.lineBetween(x, 0, x, h);
    for (let y = 0; y <= h; y += 48) g.lineBetween(0, y, w, y);
  }

  drawDecor(w, h, planet) {
    const colors = planet.decorColors || [planet.accent];
    for (let i = 0; i < 70; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const c = colors[Math.floor(Math.random() * colors.length)];
      this.add.circle(x, y, 4 + Math.random() * 10, c, 0.5);
    }
  }

  createHud() {
    this.add.rectangle(GAME_WIDTH / 2, 22, GAME_WIDTH, 44, 0x000000, 0.55).setScrollFactor(0);
    this.hudText = this.add.text(14, 11, "", { fontSize: "15px", color: "#ffffff", fontFamily: FONT }).setScrollFactor(0);
    this.planetLabel = this.add.text(GAME_WIDTH - 14, 11, "", { fontSize: "15px", color: "#ffe082", fontFamily: FONT }).setOrigin(1, 0).setScrollFactor(0);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 18, "方向鍵/WASD 移動　·　空白鍵 對話／傳送　·　I 背包", { fontSize: "14px", color: "#ffffff", fontFamily: FONT, backgroundColor: "#00000077", padding: { x: 8, y: 4 } }).setOrigin(0.5).setScrollFactor(0);
    this.updateHud();
  }

  updateHud() {
    const p = gameState.player;
    this.hudText.setText(`${p.name}  Lv.${p.level}　HP ${p.hp}/${p.maxHp}　SP ${p.sp}/${p.maxSp}　EXP ${p.exp}/${p.expToNext}　金幣 ${gameState.gold}`);
    this.planetLabel.setText(`★ ${this.planet.name}`);
  }

  flashMessage(msg) {
    const t = this.add.text(GAME_WIDTH / 2, 90, msg, { fontSize: "18px", color: "#ffe082", fontFamily: FONT, backgroundColor: "#000000aa", padding: { x: 10, y: 6 } }).setOrigin(0.5).setScrollFactor(0);
    this.tweens.add({ targets: t, alpha: 0, y: 70, duration: 1200, delay: 600, onComplete: () => t.destroy() });
  }

  // ---------------- 對話框 ----------------
  createDialogueBox() {
    this.dialogueActive = false;
    this.dialogueLines = [];
    this.dialogueIndex = 0;
    this.dialogueBg = this.add.rectangle(GAME_WIDTH / 2, 510, 760, 130, 0x000000, 0.85).setScrollFactor(0).setStrokeStyle(2, 0xffffff).setVisible(false);
    this.dialogueText = this.add.text(40, 462, "", { fontSize: "20px", color: "#ffffff", fontFamily: FONT, wordWrap: { width: 720 }, lineSpacing: 8 }).setScrollFactor(0).setVisible(false);
    this.dialogueHint = this.add.text(720, 552, "空白鍵 ▶", { fontSize: "14px", color: "#bbbbbb", fontFamily: FONT }).setScrollFactor(0).setVisible(false);
  }

  startDialogue(name, lines) {
    this.dialogueActive = true;
    this.dialogueLines = lines;
    this.dialogueIndex = 0;
    this.player.body.setVelocity(0, 0);
    this.dialogueBg.setVisible(true);
    this.dialogueText.setVisible(true).setText(lines[0]);
    this.dialogueHint.setVisible(true);
  }

  advanceDialogue() {
    this.dialogueIndex += 1;
    if (this.dialogueIndex >= this.dialogueLines.length) this.endDialogue();
    else this.dialogueText.setText(this.dialogueLines[this.dialogueIndex]);
  }

  endDialogue() {
    this.dialogueActive = false;
    this.dialogueBg.setVisible(false);
    this.dialogueText.setVisible(false);
    this.dialogueHint.setVisible(false);
  }

  // ---------------- 背包 ----------------
  createInventoryPanel() {
    this.inventoryOpen = false;
    this.invBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 520, 400, 0x10141f, 0.96).setScrollFactor(0).setStrokeStyle(2, 0x88aaff).setVisible(false);
    this.invTitle = this.add.text(GAME_WIDTH / 2, 130, "背包 / 角色", { fontSize: "24px", color: "#ffe082", fontFamily: FONT }).setOrigin(0.5).setScrollFactor(0).setVisible(false);
    this.invText = this.add.text(175, 175, "", { fontSize: "17px", color: "#ffffff", fontFamily: FONT, lineSpacing: 8 }).setScrollFactor(0).setVisible(false);
  }

  toggleInventory() {
    this.inventoryOpen = !this.inventoryOpen;
    const vis = this.inventoryOpen;
    this.invBg.setVisible(vis);
    this.invTitle.setVisible(vis);
    this.invText.setVisible(vis);
    if (vis) {
      const p = gameState.player;
      let s = `${p.name}　Lv.${p.level}　${p.job}\n\nHP ${p.hp}/${p.maxHp}　　SP ${p.sp}/${p.maxSp}\n攻擊 ${p.atk}　　防禦 ${p.def}\n金幣 ${gameState.gold}\n\n──────── 道具 ────────\n`;
      if (gameState.inventory.length === 0) s += "（空）";
      else s += gameState.inventory.map((it) => `· ${ITEMS[it.id].name} ×${it.count}`).join("\n");
      s += "\n\n按 I 或 ESC 關閉";
      this.invText.setText(s);
    }
  }
}
