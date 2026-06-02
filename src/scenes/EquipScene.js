import Phaser from "phaser";
import { FONT, GAME_WIDTH, GAME_HEIGHT } from "../data/constants.js";
import { gameState, addItem, removeItem, saveGame, effAtk, effDef } from "../data/gameState.js";
import { EQUIPMENT } from "../data/equipment.js";

// ============================================================
// EquipScene = 裝備管理。←→ 換隊員、↑↓ 選、空白鍵 裝備/卸下、ESC 離開。
// 背包裡的裝備可穿上；穿上會把舊的換回背包。
// ============================================================
export default class EquipScene extends Phaser.Scene {
  constructor() {
    super("EquipScene");
  }

  init(data) {
    this.returnPlanet = data.returnPlanet || "station";
    this.memberIndex = 0;
    this.index = 0;
  }

  create() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0a0e18);
    this.add.text(GAME_WIDTH / 2, 38, "裝備", { fontSize: "26px", color: "#ffe082", fontFamily: FONT }).setOrigin(0.5);
    this.infoText = this.add.text(GAME_WIDTH / 2, 108, "", { fontSize: "17px", color: "#ffffff", fontFamily: FONT, align: "center", lineSpacing: 7 }).setOrigin(0.5);
    this.rowTexts = [];
    this.msgText = this.add.text(GAME_WIDTH / 2, 500, "", { fontSize: "16px", color: "#7cfc9e", fontFamily: FONT }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 26, "←→ 換隊員　·　↑↓ 選擇　·　空白鍵 裝備／卸下　·　ESC 離開", { fontSize: "14px", color: "#aaaaaa", fontFamily: FONT }).setOrigin(0.5);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys("SPACE,ESC");
    this.cameras.main.fadeIn(180);
    this.build();
  }

  members() {
    return [gameState.player, ...gameState.allies];
  }

  build() {
    const owned = gameState.inventory.filter((s) => EQUIPMENT[s.id]);
    this.options = [
      { kind: "unequip", slot: "weapon", label: "— 卸下武器 —" },
      { kind: "unequip", slot: "armor", label: "— 卸下防具 —" },
      ...owned.map((s) => ({
        kind: "equip", id: s.id,
        label: `${EQUIPMENT[s.id].name}（${EQUIPMENT[s.id].slot === "weapon" ? "武器" : "防具"} ${EQUIPMENT[s.id].desc}）×${s.count}`,
      })),
      { kind: "leave", label: "離開" },
    ];
    if (this.index >= this.options.length) this.index = this.options.length - 1;
    this.rowTexts.forEach((t) => t.destroy());
    this.rowTexts = this.options.map((o, i) =>
      this.add.text(GAME_WIDTH / 2, 195 + i * 32, "", { fontSize: "18px", color: "#ffffff", fontFamily: FONT }).setOrigin(0.5)
    );
    this.render();
  }

  render() {
    const m = this.members()[this.memberIndex];
    if (!m.equip) m.equip = { weapon: null, armor: null };
    const w = m.equip.weapon ? EQUIPMENT[m.equip.weapon].name : "無";
    const a = m.equip.armor ? EQUIPMENT[m.equip.armor].name : "無";
    this.infoText.setText(`◀ ${m.name}（Lv.${m.level}）▶\n武器：${w}　防具：${a}\n攻擊 ${effAtk(m)}　防禦 ${effDef(m)}`);
    this.options.forEach((o, i) => {
      const sel = i === this.index;
      this.rowTexts[i].setColor(sel ? "#ffe082" : "#ffffff").setText((sel ? "► " : "") + o.label);
    });
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) { this.index = (this.index - 1 + this.options.length) % this.options.length; this.render(); }
    else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) { this.index = (this.index + 1) % this.options.length; this.render(); }
    else if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) { this.memberIndex = (this.memberIndex - 1 + this.members().length) % this.members().length; this.render(); }
    else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) { this.memberIndex = (this.memberIndex + 1) % this.members().length; this.render(); }
    else if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) { this.choose(); }
    else if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) { this.leave(); }
  }

  choose() {
    const o = this.options[this.index];
    const m = this.members()[this.memberIndex];
    if (!m.equip) m.equip = { weapon: null, armor: null };
    if (o.kind === "leave") { this.leave(); return; }
    if (o.kind === "unequip") {
      const cur = m.equip[o.slot];
      if (cur) {
        addItem(cur, 1);
        m.equip[o.slot] = null;
        saveGame();
        this.msgText.setColor("#7cfc9e").setText(`卸下了 ${EQUIPMENT[cur].name}`);
        this.build();
      } else {
        this.msgText.setColor("#ff6b6b").setText("該欄位沒有裝備");
      }
      return;
    }
    if (o.kind === "equip") {
      const def = EQUIPMENT[o.id];
      const cur = m.equip[def.slot];
      if (cur) addItem(cur, 1); // 換下舊裝備回背包
      removeItem(o.id, 1);
      m.equip[def.slot] = o.id;
      saveGame();
      this.msgText.setColor("#7cfc9e").setText(`${m.name} 裝備了 ${def.name}`);
      this.build();
    }
  }

  leave() {
    this.cameras.main.fadeOut(160);
    this.time.delayedCall(170, () => this.scene.start("WorldScene", { planet: this.returnPlanet, fromBattle: true }));
  }
}
