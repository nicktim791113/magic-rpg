import Phaser from "phaser";
import { FONT, GAME_WIDTH, GAME_HEIGHT } from "../data/constants.js";
import { gameState, gainExp, removeItem, saveGame, effAtk, effDef, recordKill } from "../data/gameState.js";
import { ENEMIES } from "../data/enemies.js";
import { ITEMS } from "../data/items.js";
import { SKILLS } from "../data/skills.js";
import { spriteOrShape } from "../util/art.js";

// ============================================================
// BattleScene = 回合制「隊伍」戰鬥。
// 我方隊伍 = 主角 + 已加入的同伴。每位隊員依序選指令，
// 全部行動完換敵人攻擊（隨機打一位活著的隊員）。
// 一方全倒即結束。隊員的血量直接用 gameState 裡的物件（會延續）。
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
    this.enemy = { ...def, hp: def.hp, maxHp: def.hp };
    this.state = "busy";
    this.menuType = "main";
    this.menuIndex = 0;
    this.actorIndex = 0;
  }

  create() {
    // 我方隊伍（直接引用 gameState 物件，血量會延續）
    this.party = [gameState.player, ...gameState.allies];

    // 背景星空
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0b0e1a);
    for (let i = 0; i < 90; i++) {
      this.add.circle(Math.random() * GAME_WIDTH, Math.random() * GAME_HEIGHT * 0.7, Math.random() * 1.6 + 0.3, 0xffffff, Math.random() * 0.6 + 0.2);
    }

    // 敵人
    const ex = GAME_WIDTH / 2, ey = 170;
    this.enemySprite = spriteOrShape(this, ex, ey, `enemy-${this.enemyId}`, this.enemy.r * 2.4, () => {
      const shape =
        this.enemy.shape === "rect"
          ? this.add.rectangle(ex, ey, this.enemy.r * 2, this.enemy.r * 2, this.enemy.color)
          : this.add.circle(ex, ey, this.enemy.r, this.enemy.color);
      return shape.setStrokeStyle(3, 0xffffff);
    });
    this.add.text(ex, 70, this.enemy.name, { fontSize: "22px", color: "#ffffff", fontFamily: FONT }).setOrigin(0.5);
    this.add.rectangle(ex, 92, 160, 12, 0x333333).setOrigin(0.5);
    this.enemyHpBar = this.add.rectangle(ex - 80, 92, 160, 12, 0xff5555).setOrigin(0, 0.5);

    // 我方隊員面板（左下，可疊 1~2 位）
    this.partyTexts = [];
    this.party.forEach((m, i) => {
      this.add.rectangle(150, 442 + i * 66, 286, 60, 0x10141f, 0.92).setStrokeStyle(2, 0x88aaff);
      this.partyTexts.push(this.add.text(22, 420 + i * 66, "", { fontSize: "15px", color: "#ffffff", fontFamily: FONT, lineSpacing: 4 }));
    });

    // 訊息列
    this.msgText = this.add.text(GAME_WIDTH / 2, 300, "", { fontSize: "20px", color: "#ffe082", fontFamily: FONT, align: "center", wordWrap: { width: 720 } }).setOrigin(0.5);

    // 指令選單（右下）
    this.add.rectangle(592, 470, 380, 150, 0x10141f, 0.92).setStrokeStyle(2, 0x88aaff);
    this.menuTexts = [];

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys("SPACE,ESC");

    this.updatePartyTexts();
    this.updateBars();
    this.cameras.main.fadeIn(250);

    this.showMessage(`野生的 ${this.enemy.name} 出現了！`);
    this.time.delayedCall(900, () => this.startRound());
  }

  update() {
    if (this.state !== "menu") return;
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

  // ---------- 回合流程 ----------
  startRound() {
    this.actorIndex = 0;
    this.toActorMenu();
  }

  toActorMenu() {
    while (this.actorIndex < this.party.length && this.party[this.actorIndex].hp <= 0) this.actorIndex++;
    if (this.actorIndex >= this.party.length) {
      this.enemyTurn();
      return;
    }
    this.actor = this.party[this.actorIndex];
    this.state = "menu";
    this.updatePartyTexts();
    this.showMessage(`輪到 ${this.actor.name}，要怎麼行動？`);
    this.buildMenu("main");
  }

  afterActorAction() {
    if (this.enemy.hp <= 0) {
      this.victory();
      return;
    }
    this.actorIndex += 1;
    this.toActorMenu();
  }

  enemyTurn() {
    this.state = "busy";
    const alive = this.party.filter((m) => m.hp > 0);
    if (alive.length === 0) {
      this.defeat();
      return;
    }
    const target = alive[Math.floor(Math.random() * alive.length)];
    const dmg = this.calcDamage(this.enemy.atk, effDef(target));
    target.hp = Math.max(0, target.hp - dmg);
    this.cameras.main.shake(150, 0.012);
    this.updatePartyTexts();
    this.showMessage(`${this.enemy.name} 攻擊 ${target.name}，造成 ${dmg} 點傷害！`);
    this.time.delayedCall(1000, () => {
      if (this.party.every((m) => m.hp <= 0)) this.defeat();
      else this.startRound();
    });
  }

  // ---------- 選單 ----------
  buildMenu(type) {
    this.menuType = type;
    this.menuIndex = 0;
    this.menuTexts.forEach((t) => t.destroy());
    this.menuTexts = [];
    let labels = [];
    if (type === "main") {
      labels = ["攻擊", "技能", "道具", "逃跑"];
    } else if (type === "skills") {
      labels = this.actor.skills.map((id) => `${SKILLS[id].name}  (SP ${SKILLS[id].sp})`);
      labels.push("← 返回");
    } else if (type === "items") {
      if (gameState.inventory.length === 0) labels = ["（沒有道具）", "← 返回"];
      else {
        labels = gameState.inventory.map((it) => `${ITEMS[it.id].name} ×${it.count}`);
        labels.push("← 返回");
      }
    }
    this.menuLabels = labels;
    labels.forEach((label, i) => {
      this.menuTexts.push(this.add.text(470, 415 + i * 26, label, { fontSize: "18px", color: "#cccccc", fontFamily: FONT }));
    });
    this.state = "menu";
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
      const skills = this.actor.skills;
      if (this.menuIndex >= skills.length) this.buildMenu("main");
      else this.doSkill(skills[this.menuIndex]);
    } else if (this.menuType === "items") {
      const inv = gameState.inventory;
      if (inv.length === 0 || this.menuIndex >= inv.length) this.buildMenu("main");
      else this.doItem(inv[this.menuIndex].id);
    }
  }

  beginAction() {
    this.state = "busy";
    this.menuTexts.forEach((t) => t.setVisible(false));
  }

  // ---------- 行動 ----------
  doAttack() {
    this.beginAction();
    const dmg = this.calcDamage(effAtk(this.actor), this.enemy.def);
    this.enemy.hp -= dmg;
    this.hitShake(this.enemySprite);
    this.updateBars();
    this.showMessage(`${this.actor.name} 攻擊，對 ${this.enemy.name} 造成 ${dmg} 點傷害！`);
    this.time.delayedCall(950, () => this.afterActorAction());
  }

  doSkill(id) {
    const sk = SKILLS[id];
    if (this.actor.sp < sk.sp) {
      this.beginAction();
      this.showMessage("SP 不足！");
      this.time.delayedCall(700, () => this.buildMenu("main"));
      return;
    }
    this.beginAction();
    this.actor.sp -= sk.sp;
    if (sk.type === "attack") {
      const dmg = Math.floor(this.calcDamage(effAtk(this.actor), this.enemy.def) * sk.power);
      this.enemy.hp -= dmg;
      this.hitShake(this.enemySprite);
      this.updateBars();
      this.showMessage(`${this.actor.name} 使出「${sk.name}」，造成 ${dmg} 點傷害！`);
    } else {
      this.actor.hp = Math.min(this.actor.maxHp, this.actor.hp + sk.amount);
      this.showMessage(`${this.actor.name} 使用「${sk.name}」，恢復了 ${sk.amount} HP！`);
    }
    this.updatePartyTexts();
    this.updateBars();
    this.time.delayedCall(950, () => this.afterActorAction());
  }

  doItem(id) {
    this.beginAction();
    const def = ITEMS[id];
    removeItem(id, 1);
    if (def.type === "heal") {
      this.actor.hp = Math.min(this.actor.maxHp, this.actor.hp + def.amount);
      this.showMessage(`${this.actor.name} 使用 ${def.name}，恢復 ${def.amount} HP！`);
    } else {
      this.actor.sp = Math.min(this.actor.maxSp, this.actor.sp + def.amount);
      this.showMessage(`${this.actor.name} 使用 ${def.name}，恢復 ${def.amount} SP！`);
    }
    this.updatePartyTexts();
    this.time.delayedCall(950, () => this.afterActorAction());
  }

  doFlee() {
    this.beginAction();
    if (Math.random() < 0.55) {
      this.showMessage("全隊成功逃脫！");
      this.time.delayedCall(800, () => this.endBattle());
    } else {
      this.showMessage("逃跑失敗！");
      this.time.delayedCall(800, () => this.enemyTurn());
    }
  }

  // ---------- 勝 / 敗 ----------
  victory() {
    this.state = "busy";
    const { exp, gold, name } = this.enemy;
    gameState.gold += gold;
    gameState.cleared.add(this.enemyKey);
    recordKill(this.enemyId);
    const levelMsgs = [];
    this.party.forEach((m) => {
      if (m.hp > 0) {
        const res = gainExp(exp, m);
        if (res.levels.length) levelMsgs.push(`${m.name} 升到 Lv.${m.level}！`);
        res.learned.forEach((nm) => levelMsgs.push(`${m.name} 學會了「${nm}」！`));
      }
    });
    this.tweens.add({ targets: this.enemySprite, alpha: 0, scale: 0.3, duration: 400 });
    this.updatePartyTexts();
    saveGame();
    this.playMessages([`戰勝 ${name}！全員獲得 ${exp} 經驗、${gold} 金幣。`, ...levelMsgs], () => this.endBattle());
  }

  defeat() {
    this.state = "busy";
    this.party.forEach((m) => { m.hp = Math.max(1, Math.floor(m.maxHp / 2)); });
    gameState.currentPlanet = "station";
    gameState.returnPos = null;
    saveGame();
    this.playMessages(["全隊被擊倒了……緊急傳送回太空站。"], () => {
      this.cameras.main.fadeOut(250);
      this.time.delayedCall(260, () => this.scene.start("WorldScene", { planet: "station" }));
    });
  }

  endBattle() {
    saveGame();
    this.cameras.main.fadeOut(250);
    this.time.delayedCall(260, () => this.scene.start("WorldScene", { planet: this.returnPlanet, fromBattle: true }));
  }

  // ---------- 小工具 ----------
  playMessages(msgs, onDone) {
    let i = 0;
    const next = () => {
      if (i >= msgs.length) { onDone(); return; }
      this.showMessage(msgs[i]);
      i += 1;
      this.time.delayedCall(1100, next);
    };
    next();
  }

  calcDamage(atk, def) {
    const base = Math.max(1, atk - Math.floor(def / 2));
    const variance = 0.85 + Math.random() * 0.3;
    return Math.max(1, Math.round(base * variance));
  }

  hitShake(obj) {
    const ox = obj.x;
    this.tweens.add({ targets: obj, x: ox + 8, duration: 50, yoyo: true, repeat: 2, onComplete: () => { obj.x = ox; } });
  }

  updateBars() {
    this.enemyHpBar.scaleX = Math.max(0, this.enemy.hp) / this.enemy.maxHp;
  }

  updatePartyTexts() {
    this.party.forEach((m, i) => {
      const t = this.partyTexts[i];
      if (!t) return;
      const active = this.state === "menu" && this.actor === m;
      const dead = m.hp <= 0;
      t.setColor(dead ? "#888888" : active ? "#ffe082" : "#ffffff");
      t.setText(`${active ? "▶ " : ""}${m.name}  Lv.${m.level}\nHP ${m.hp}/${m.maxHp}　SP ${m.sp}/${m.maxSp}${dead ? "  (倒下)" : ""}`);
    });
  }

  showMessage(msg) {
    this.msgText.setText(msg);
  }
}
