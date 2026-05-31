# 魔法 RPG

用 **Vite + Phaser 4** 開發的網頁遊戲。目前包含兩種玩法場景：

- **PlatformerScene** — 2.5D 橫向捲軸闖關（超級瑪利歐風格）← 目前開場顯示這個
- **WorldScene** — 俯視角 RPG（像仙劍那種走地圖、跟 NPC 對話）← 保留中

---

## 怎麼執行

```bash
npm install   # 第一次才需要（已經裝好了）
npm run dev   # 啟動開發伺服器
```

然後用瀏覽器打開終端機顯示的網址（通常是 http://localhost:5173 ）。
存檔後畫面會自動重新整理（熱重載）。

> 注意：遊戲要在「看得見的分頁」才會動。瀏覽器會把背景分頁的動畫暫停，
> 所以如果切到別的分頁，遊戲會像「卡住」一樣，切回來就恢復。

---

## 操作方式（2.5D 闖關）

| 按鍵 | 動作 |
|------|------|
| `←` `→` 或 `A` `D` | 左右移動 |
| `空白鍵` / `↑` / `W` | 跳躍 |

收集金幣，抵達右邊的 🚩 終點就過關。掉進坑裡會回到起點。

---

## 專案結構

```
src/
  main.js                  ← 遊戲總設定（場景清單在這裡）
  scenes/
    PlatformerScene.js     ← 2.5D 橫向闖關（這次新增）
    WorldScene.js          ← 俯視角 RPG（原本就有）
```

## 想切換成 RPG 場景？

打開 `src/main.js`，把場景清單的順序對調（第一個會開場）：

```js
scene: [WorldScene, PlatformerScene],   // 改成這樣就會先進 RPG
```

---

## 想自己動手調整（新手練習）

打開 `src/scenes/PlatformerScene.js`：

- **手感**：最上面的 `MOVE_SPEED`（跑多快）、`JUMP_SPEED`（跳多高）、`GRAVITY`（掉多快）
- **關卡地形**：`addGround(起格, 迄格)`、`addPlatform(起格, 迄格, 離地高度)`
- **金幣位置**：`addCoinRow(起格, 迄格, 離地高度)`
- **想看碰撞框**：`main.js` 裡把 `arcade.debug` 改成 `true`

> 小技巧：遊戲實例掛在 `window.game`，可以直接在瀏覽器 console 玩，
> 例如 `game.scene.getScene("PlatformerScene")` 觀察場景內容。

---

## 之後可以加什麼

- 🦊 敵人（會走動、踩到會受傷）
- 🔊 音效與背景音樂
- 🗺️ 多個關卡 / 關卡切換
- 🧙 把黃色方塊換成真正的角色圖片與走路動畫
- 📱 手機觸控按鈕（左右 + 跳）
- ✨ 把闖關關卡接回 RPG（例如當作「地城」關卡）
