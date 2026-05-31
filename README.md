# 魔法 RPG · 星界旅人（Astral Voyager）

用 **Vite + Phaser 4** 開發的網頁版**太空角色扮演遊戲（RPG）**，並包裝成可安裝的 **PWA**。
駕著太空船航向未知星球，在地圖上探索、遇敵進入回合制戰鬥、打怪升級。

🎮 **線上遊玩**：<https://nicktim791113.github.io/magic-rpg/>
（用 Chrome 開啟後，網址列會出現「安裝」圖示，可裝成桌面／手機 App，離線也能玩。）

---

## 怎麼執行

```bash
npm install   # 第一次才需要（已經裝好了）
npm run dev   # 啟動開發伺服器
```

然後用瀏覽器打開終端機顯示的網址（通常是 http://localhost:5173 ）。
存檔後畫面會自動重新整理（熱重載）。

> 注意：遊戲要在「看得見的分頁」才會動。瀏覽器會把背景分頁的動畫暫停，
> 所以切到別的分頁時遊戲會像「卡住」，切回來就恢復。

---

## 遊戲流程

```
標題 (TitleScene) ──按空白鍵──▶ 探索星球 (WorldScene) ──遇敵──▶ 回合制戰鬥 (BattleScene)
                                        ▲                              │
                                        └──────────戰鬥結束────────────┘
```

## 操作方式

- **標題畫面**：按 `空白鍵` 開始
- **探索**：方向鍵 / `WASD` 移動，靠近 NPC 或物件按 `空白鍵` 互動
- **戰鬥**：回合制，用選單選擇攻擊 / 技能 / 道具

---

## 專案結構

```
src/
  main.js                 ← 遊戲總設定（場景清單在這裡）
  scenes/
    TitleScene.js         ← 開場標題畫面
    WorldScene.js         ← 探索星球（俯視角走動、與 NPC/物件互動）
    BattleScene.js        ← 回合制戰鬥
  data/
    gameState.js          ← 共用存檔狀態（數值、金幣、背包、所在星球）
    constants.js          ← 共用常數（字型、畫面尺寸）
    skills.js             ← 技能定義
    items.js              ← 道具定義
    enemies.js            ← 敵人定義
    planets.js            ← 星球 / 地圖定義
```

> `data/` 裡是「資料」，`scenes/` 裡是「畫面與流程」。
> 所有場景共用同一份 `gameState`，所以戰鬥扣的血、撿到的道具，回到地圖都看得到。

## 主角與系統（出自 `gameState.js`）

- 主角：**艾拉**（星際冒險者），有等級 / 經驗 / HP / SP / 攻擊 / 防禦
- 技能（消耗 SP）、背包道具、金幣
- 打怪獲得經驗會自動升級，數值成長、回滿血

---

## 更新線上版本（部署）

線上版部署在 GitHub Pages（`gh-pages` 分支）。改完程式想更新線上版本，執行：

```bash
npm run deploy   # 會自動 build 並推送到 gh-pages 分支
```

幾十秒後重新整理 <https://nicktim791113.github.io/magic-rpg/> 就會看到新版本。

> 原始碼在 `main` 分支，建置後的網站在 `gh-pages` 分支。
> （想升級成「push 到 main 就自動部署」需要 GitHub Actions，
> 屆時要替 token 加上 `workflow` 權限。）

---

## 之後可以加什麼

- 🪐 更多星球與劇情
- 👾 更多敵人與頭目戰
- 🎒 商店 / 裝備系統
- 💾 存檔到 localStorage（關掉瀏覽器也不會消失）
- 🔊 音效與背景音樂
